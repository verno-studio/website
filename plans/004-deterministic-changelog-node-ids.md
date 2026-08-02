# 004 — Give changelog nodes deterministic ids

- **Status**: TODO
- **Commit**: 7672258
- **Severity**: MEDIUM
- **Category**: Bugs & correctness
- **Rule**: Adjacent to `react-doctor/no-random-key` (the rule does not fire here — see below)
- **Estimated scope**: 2 files, ~30 lines

## Problem

Two related defects in how changelog nodes get their React keys.

### (a) Every id is a fresh random UUID

`apps/web/lib/changelog.ts` stamps `crypto.randomUUID()` on every parsed node —
nine call sites: lines **55, 64, 77, 88, 110, 132, 141, 168, 229**.

    // apps/web/lib/changelog.ts:55 — current (representative)
    nodes.push({ id: crypto.randomUUID(), type: "text", value });

Those ids are used directly as React keys in
`apps/web/components/changelog.tsx` at lines **26, 29, 33, 40, 47, 84, 133**:

    // apps/web/components/changelog.tsx:26 — current
    return <span key={node.id}>{node.value}</span>;

The canonical `react-doctor/no-random-key` prompt names this exact blind spot:

> Known limitation (do NOT treat as a stability guarantee): the rule does not
> follow identifier bindings, so `key={key}` where `const key = nanoid()` will
> NOT fire even when that const is computed per-item inside the map — this is a
> false-negative the detector cannot catch without scope analysis, not evidence
> the key is stable.

**Be precise about the blast radius.** `getChangelog()` memoises the parse in a
module-level `cached` (`changelog.ts:337-344`) and the release pages are
statically generated (`app/updates/[slug]/page.tsx:11`), so ids _are_ stable
within a build and there is **no runtime remount today**. The real cost is build
non-determinism: every `next build` produces different keys, so the RSC payload
for every release page changes on every deploy even when the changelog did not,
busting caches for content that is byte-identical. It also makes the build
non-reproducible.

The canonical fix prompt prescribes the direction:

> If the data lacks a unique field, assign each item a persistent id once at
> creation (e.g. when fetching or pushing into state) rather than generating one
> in render.

Ids are already assigned at creation — they just need to be derived
deterministically instead of randomly.

### (b) List items have no id, so their key is reconstructed from text

`ChangelogBlock`'s list variant (`changelog.ts:16`) is `items: InlineNode[][]` —
the items have no id, so the component rebuilds one from the text:

    // apps/web/components/changelog.tsx:71-88 — current
    {block.items.map((item) => {
      const itemKey = item
        .map((n) => {
          if (n.type === "text" || n.type === "code") {
            return n.value;
          }
          if (n.type === "link") {
            return n.label;
          }
          return "";
        })
        .join("");
      return (
        <li key={itemKey}>
          <InlineContent nodes={item} />
        </li>
      );
    })}

This returns `""` for `strong` and `em` nodes instead of recursing, so a list
item written as `- **Bold only**` keys as the empty string, and two such items in
one list collide. `inlineToText` at `changelog.ts:349-360` already does this
flattening correctly _and recursively_ — this is a worse duplicate of it.

Today's `packages/cli/CHANGELOG.md` has no nested list items, so this is latent
rather than firing. It is worth fixing alongside (a) because the same edit
removes it.

## Target

### `apps/web/lib/changelog.ts`

Add a deterministic id source near the top of the file, after the type
declarations and before `versionToSlug` (`changelog.ts:40`):

    let idCounter = 0;
    const nextId = () => `n${(idCounter += 1)}`;

Reset it at the start of `parseChangelog` so a given source always yields the
same ids (`changelog.ts:243-245`):

    const parseChangelog = (source: string): ChangelogRelease[] => {
      idCounter = 0;
      const lines = source.split("\n");
      const releases: ChangelogRelease[] = [];

Replace **all nine** `crypto.randomUUID()` calls with `nextId()`. No other part
of those object literals changes. For example:

    // changelog.ts:55 — target
    nodes.push({ id: nextId(), type: "text", value });

Give list items an id by introducing a type and using it in the `list` block:

    // changelog.ts — target, new type next to the other exports
    export interface ChangelogListItem {
      id: string;
      nodes: InlineNode[];
    }

    // changelog.ts:16 — target
    | { id: string; type: "list"; items: ChangelogListItem[] };

Update the three places that push list items (`changelog.ts:137`, `:195`,
`:207`) to push `{ id: nextId(), nodes: parseInline(...) }` instead of a bare
`InlineNode[]`, and widen the two local declarations
(`flushList`'s `items` parameter at `:135` and `listItems` at `:149`) from
`InlineNode[][]` to `ChangelogListItem[]`.

    // changelog.ts:135-144 — target
    const flushList = (items: ChangelogListItem[], buffer: string[], blocks: ChangelogBlock[]) => {
      if (buffer.length) {
        items.push({ id: nextId(), nodes: parseInline(buffer.join(" ").trim()) });
        buffer.length = 0;
      }
      if (items.length) {
        blocks.push({ id: nextId(), items: [...items], type: "list" });
        items.length = 0;
      }
    };

Update `blockToText` for the new shape (`changelog.ts:366-368`):

    // changelog.ts:366-368 — target
    if (block.type === "list") {
      return block.items.map((item) => inlineToText(item.nodes)).join(" ");
    }

### `apps/web/components/changelog.tsx`

Delete the hand-rolled `itemKey` entirely:

    // changelog.tsx:68-91 — target
    if (block.type === "list") {
      return (
        <ul>
          {block.items.map((item) => (
            <li key={item.id}>
              <InlineContent nodes={item.nodes} />
            </li>
          ))}
        </ul>
      );
    }

## Repo conventions to follow

- Object literal keys are sorted alphabetically by the lint preset — note
  `{ id: nextId(), items: [...items], type: "list" }` and
  `{ id: nextId(), nodes: parseInline(...) }` already follow it. Run
  `bun run format` rather than hand-sorting.
- Types are declared with `export type` / `export interface` at the top of
  `changelog.ts` — follow the existing placement (see `ChangelogItem` at
  `changelog.ts:18-21` as the exemplar for a new interface).
- The parser uses small module-scope helpers (`versionToSlug`, `pushText`,
  `flushParagraph`); `nextId` fits that pattern.

## Steps

1. In `apps/web/lib/changelog.ts`, add `idCounter` / `nextId` and reset
   `idCounter = 0` as the first statement of `parseChangelog`.
2. Replace all nine `crypto.randomUUID()` calls with `nextId()`. Confirm with
   `grep -c "crypto.randomUUID" apps/web/lib/changelog.ts` → `0`.
3. Add the `ChangelogListItem` interface, change the `list` block's `items` type,
   and update `flushList`, the two inline `listItems.push(...)` sites, the
   `listItems` declaration, and `blockToText`.
4. In `apps/web/components/changelog.tsx`, replace the list branch of `Block`
   with the Target block above.
5. Run `bun run format`, then re-read the diff and remove unrelated churn.

## Boundaries

- Do NOT touch `changelog.tsx:118-123`. The `key={`${item.id}-${itemIndex}`}`
  with its `oxlint-disable-next-line react/no-array-index-key` comment is a
  deliberate, documented decision (multiple changelog entries can share one
  commit id because changesets bundles them). Leave the suppression and its
  comment exactly as they are.
- Do NOT switch any key to a bare array index — `react-doctor/no-array-index-key`
  is an error-severity rule and would drop the score.
- Do NOT change the parser's behaviour: the same markdown must produce the same
  blocks, in the same order, with the same text.
- Do NOT change `getChangelog`'s caching or the public signatures of
  `getRelease` / `getReleaseSummary`.
- Do NOT add a dependency (no hashing library).
- **Known tradeoff, accept it:** a monotonic counter means inserting a release at
  the top of the changelog shifts the ids of everything after it. That is
  acceptable — ids only need to be unique among siblings and identical across
  builds of identical input. Do not over-engineer a content-hash scheme.
- STOP if the excerpts above no longer match the files; report the drift.

## Verification

- **Mechanical**:
  - `npx react-doctor@latest --verbose --scope changed` — score stays at 100 and
    no `no-random-key` / `no-array-index-as-key` diagnostic appears.
  - `bun run typecheck` — the `ChangelogListItem` change must propagate cleanly
    to `blockToText` and `changelog.tsx` with no `any` and no cast.
  - `bun run lint`, `bun run test`.
  - **Determinism check**: `bun run build --filter web` twice in a row, and
    confirm the generated release pages are byte-identical between runs
    (e.g. `sha256sum` the same file under `apps/web/.next/server/app/updates/`
    after each build). Before this change the hashes differ; after it they match.
- **Behavior check**:
  1. `bun run dev`, open `/updates` and click into a release.
  2. Confirm the rendered release page is visually identical to before: same
     ordering of paragraphs, lists and code blocks, same badge, same commit
     links.
  3. Open the browser console and confirm there is **no** "Encountered two
     children with the same key" warning.
  4. Temporarily add a bullet list to `packages/cli/CHANGELOG.md` under an
     existing entry with two items that are entirely bold (`- **One**` /
     `- **Two**`), reload, and confirm both render and no duplicate-key warning
     appears. Revert the CHANGELOG edit afterwards.
- **Done when**: no `crypto.randomUUID` remains in the parser, two consecutive
  builds produce identical release-page output, the rendered pages are unchanged,
  and all mechanical checks pass.
