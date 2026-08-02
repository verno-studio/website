# 005 — Announce updates search results to assistive technology

- **Status**: DONE
- **Commit**: 7672258
- **Severity**: MEDIUM
- **Category**: Accessibility
- **Rule**: Beyond the scan
- **Estimated scope**: 1 file, ~12 lines

## Problem

`apps/web/components/updates-index.tsx` filters the release list as the user
types, but nothing announces the outcome. A screen-reader user types into the
search field and receives no feedback that the list changed, how many releases
matched, or that a query matched nothing — the results simply swap silently
underneath. This is WCAG 2.2 SC 4.1.3 (Status Messages).

    // apps/web/components/updates-index.tsx:40-57 — current
    <input
      aria-label="Search updates by version or content"
      autoComplete="off"
      className="w-full material-base bg-transparent py-2.5 pr-3 pl-9 placeholder:text-gray-900 transition-colors duration-200 ease-out"
      id={inputId}
      onChange={(event) => setQuery(event.target.value)}
      placeholder={`Search ${releases.length} updates by version or content...`}
      type="search"
      value={query}
    />
    </div>

    {filtered.length === 0 ? (
      <p className="px-4 py-8 text-center text-gray-900">
        No updates match &ldquo;{query}&rdquo;.
      </p>
    ) : (

The "No updates match" paragraph at `:52-55` is rendered _conditionally_, so it
does not exist in the DOM when results are present. An element that is inserted
rather than updated is not reliably announced, and the non-empty case has no
equivalent message at all.

Secondarily, the input is named twice:

    // apps/web/components/updates-index.tsx:32-34 — current
    <label className="sr-only" htmlFor={inputId}>
      Search updates
    </label>

`aria-label` on the input (`:41`) wins over the associated `<label>`, so the
accessible name is "Search updates by version or content" and the `<label>`
element contributes nothing to assistive technology. It is not harmful — it still
gives a click target that focuses the input — but two naming mechanisms that
disagree is a maintenance trap.

## Target

Keep the visible-to-AT label as the single naming mechanism (a real `<label>` is
preferred over `aria-label` because it also works for voice control and click
targeting), and add a permanently-mounted live region that reports the count.

    // apps/web/components/updates-index.tsx:32-50 — target
    <label className="sr-only" htmlFor={inputId}>
      Search updates by version or content
    </label>
    <div className="relative">
      <SearchIcon
        aria-hidden
        className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-900"
      />
      <input
        autoComplete="off"
        className="w-full material-base bg-transparent py-2.5 pr-3 pl-9 placeholder:text-gray-900 transition-colors duration-200 ease-out"
        id={inputId}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={`Search ${releases.length} updates by version or content...`}
        type="search"
        value={query}
      />
    </div>

    <output className="sr-only">
      {query
        ? `${filtered.length} ${filtered.length === 1 ? "update" : "updates"} match ${query}`
        : ""}
    </output>

Note the live region is **always rendered** — only its text content changes — so
assistive technology observes an update to an existing region rather than a node
insertion. It stays empty while the query is empty so it says nothing on first
load.

The existing visible "No updates match" paragraph at `:52-55` stays exactly as it
is; it is the sighted user's feedback and the live region is the AT equivalent.

## Repo conventions to follow

- **Exemplar to imitate: `packages/design-system/components/copy-button.tsx:65-67`.**
  It is the repo's existing live region and uses precisely this shape — a
  permanently-mounted `sr-only` element whose content is conditional:

      <span aria-live="polite" className="sr-only">
        {copied ? "Copied to clipboard" : ""}
      </span>

  Follow its shape, but use `<output>` rather than a `<p>` with an explicit
  `role="status"` — `output` carries that role and `aria-live="polite"`
  implicitly, and the repo's `jsx-a11y(prefer-tag-over-role)` rule rejects the
  explicit form.

- The singular/plural ternary already exists in this file at `:67`
  (`{itemCount === 1 ? "change" : "changes"}`) — match that phrasing style.
- JSX attributes are sorted alphabetically by the lint preset. Run
  `bun run format` rather than hand-sorting.

## Steps

1. In `apps/web/components/updates-index.tsx`, change the `<label>` text at `:33`
   to `Search updates by version or content`.
2. Remove the `aria-label` attribute from the `<input>` at `:41`.
3. Add the `aria-live` status paragraph immediately after the closing `</div>` of
   the input wrapper (`:50`) and before the `{filtered.length === 0 ? ...}`
   ternary.
4. Run `bun run format`, then re-read the diff and remove unrelated churn.

## Boundaries

- Do NOT delete or restyle the visible "No updates match" paragraph at `:52-55`.
- Do NOT add `aria-live` to the results `<ul>` itself — announcing every list item
  on every keystroke is far worse than announcing a count.
- Do NOT debounce, throttle, or otherwise change the filtering behaviour or the
  `useMemo` at `:17-28`. It is correct as written and the dataset is small.
- Do NOT add a dependency.
- Do NOT change the `useId` usage — it is the correct way to link label and input.
- STOP if the excerpts above no longer match the file; report the drift.

## Verification

- **Mechanical**:
  - `npx react-doctor@latest --verbose --scope changed` — score stays at 100 and
    no `control-has-associated-label` diagnostic appears (the `<label>` +
    `htmlFor` pairing must keep satisfying it after `aria-label` is removed).
  - `bun run typecheck`, `bun run lint`, `bun run test`.
- **Behavior check**:
  1. `bun run dev`, open `/updates`.
  2. With a screen reader running (VoiceOver: `Cmd+F5`; NVDA on Windows), focus
     the search field and confirm it is announced as "Search updates by version
     or content".
  3. Type a query that matches — confirm the reader announces e.g. "3 updates
     match cli" without moving focus.
  4. Type a query that matches nothing — confirm it announces "0 updates match
     …" and the visible "No updates match" paragraph is shown.
  5. Clear the field and confirm nothing is announced for the empty query.
  6. Confirm clicking the (invisible) label area still focuses the input.
- **Done when**: the field has exactly one accessible name, result counts are
  announced on change without stealing focus, the empty query is silent, and all
  mechanical checks pass.
