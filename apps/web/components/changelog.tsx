import { cn } from "@/lib/utils";
import type { ChangeKind, ChangelogBlock, ChangelogRelease, InlineNode } from "@/lib/changelog";

const KIND_LABEL: Record<ChangeKind, string> = {
  major: "Major",
  minor: "Minor",
  patch: "Patch",
};

// Geist badge variants only swap --geist-background/--geist-foreground, so the
// kinds do the same. Weight descends: blue fill (major) → gray fill (minor) →
// outline only (patch).
const KIND_CLASS: Record<ChangeKind, string> = {
  major:
    "[--geist-background:var(--ds-blue-200)] [--geist-foreground:var(--ds-blue-900)] ring-blue-400",
  minor:
    "[--geist-background:var(--ds-gray-200)] [--geist-foreground:var(--ds-gray-1000)] ring-gray-alpha-400",
  patch:
    "[--geist-background:transparent] [--geist-foreground:var(--ds-gray-900)] ring-gray-alpha-400",
};

const InlineContent = ({ nodes }: { nodes: InlineNode[] }) => (
  <>
    {nodes.map((node) => {
      if (node.type === "text") {
        return <span key={node.id}>{node.value}</span>;
      }
      if (node.type === "code") {
        return <code key={node.id}>{node.value}</code>;
      }
      if (node.type === "strong") {
        return (
          <strong key={node.id}>
            <InlineContent nodes={node.nodes} />
          </strong>
        );
      }
      if (node.type === "em") {
        return (
          <em key={node.id}>
            <InlineContent nodes={node.nodes} />
          </em>
        );
      }
      return (
        <a
          key={node.id}
          href={node.href}
          rel="noopener noreferrer"
          target="_blank"
          className="underline underline-offset-4 decoration-gray-900/60 hover:decoration-gray-1000 transition-colors duration-200 ease-out"
        >
          {node.label}
        </a>
      );
    })}
  </>
);

const Block = ({ block }: { block: ChangelogBlock }) => {
  if (block.type === "paragraph") {
    return (
      <p>
        <InlineContent nodes={block.nodes} />
      </p>
    );
  }
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
  return (
    <pre className="material-base overflow-x-auto p-4 text-sm">
      <code>{block.code}</code>
    </pre>
  );
};

const KindBadge = ({ kind }: { kind: ChangeKind }) => (
  <span
    className={cn(
      "tracking-normal inline-flex shrink-0 self-start items-center justify-center rounded-full whitespace-nowrap py-0.5 font-medium capitalize tabular-nums",
      "**:data-[slot=icon]:block **:data-[slot=icon]:shrink-0 **:data-[slot=icon]:[-webkit-transform:translate(0px,0px)] h-6 px-3 gap-1.25 text-[12px]/[24px]",
      "**:data-[slot=icon]:size-3.5 bg-(--geist-background) text-(--geist-foreground) [text-decoration-style:none] ring-1 ring-gray-alpha-400 ring-inset hover:[a,button]:bg-gray-200 **:data-[slot=icon]:-ml-1 **:data-[slot=icon]:data-[glyph=circular]:-ml-1.75 **:data-[slot=icon]:has-data-[glyph=circular]:-ml-1.75 has-data-[glyph=circular]:pr-2.5",
      KIND_CLASS[kind],
    )}
  >
    {KIND_LABEL[kind]}
  </span>
);

export const Release = ({ release }: { release: ChangelogRelease }) => (
  <section className="flex flex-col gap-12">
    {release.groups.map((group) => (
      <div className="flex flex-col gap-4" key={`${release.slug}-${group.kind}`}>
        <KindBadge kind={group.kind} />
        <ul className="flex list-none flex-col gap-8 pl-0">
          {group.items.map((item, itemIndex) => (
            <li
              // oxlint-disable-next-line react/no-array-index-key -- multiple items can share a commit id (changesets bundles them)
              key={`${item.id}-${itemIndex}`}
              className="flex flex-col gap-3"
            >
              <a
                href={`https://github.com/verno-studio/website/commit/${item.id}`}
                rel="noopener noreferrer"
                target="_blank"
                className="self-start font-mono text-xs text-gray-900 hover:text-gray-1000 transition-colors duration-200 ease-out"
              >
                {item.id.slice(0, 7)}
              </a>
              {item.blocks.map((block) => (
                <Block key={block.id} block={block} />
              ))}
            </li>
          ))}
        </ul>
      </div>
    ))}
  </section>
);
