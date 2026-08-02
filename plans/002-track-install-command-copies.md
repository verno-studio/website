# 002 — Fire a real analytics event when the install command is copied

- **Status**: TODO
- **Commit**: 7672258
- **Severity**: HIGH
- **Category**: Maintainability & architecture
- **Rule**: Beyond the scan
- **Estimated scope**: 2 files, ~20 lines

## Problem

`apps/web/components/installer.tsx:18` sets a `data-track` attribute that nothing
in the repository reads:

    // apps/web/components/installer.tsx:15-19 — current
    <CopyButton
      value={command}
      aria-label="Copy install command"
      data-track="install_command_copied"
    />

`grep -rn "data-track" apps packages` returns exactly one hit — this line. The
attribute spreads through `CopyButton`'s `{...props}`
(`packages/design-system/components/copy-button.tsx:48`) onto the DOM button and
stops there.

`data-track` is not a PostHog convention either. PostHog's autocapture reads
`data-attr`, so even the generic `$autocapture` event does not surface this name
as a property. The result: copying `bunx @vernostudio/cli create` — the single
call to action on the landing page — produces no named event.

`CopyButton` cannot capture the event itself: it lives in
`@vernostudio/design-system`, which has no PostHog dependency and must not gain
one. `Installer` is currently a server component, and a server component cannot
pass a function prop to a client component, so the callback has to originate in a
client component.

## Target

Add an optional `onCopy` callback to `CopyButton`, fired only after the clipboard
write succeeds:

    // packages/design-system/components/copy-button.tsx — target (changed parts only)
    interface CopyButtonProps extends Omit<ComponentProps<"button">, "onClick"> {
      readonly value: string;
      readonly onCopy?: () => void;
    }

    export const CopyButton = ({ value, onCopy, className, ...props }: CopyButtonProps) => {
      const [copied, setCopied] = useState(false);

      const handleCopy = useCallback(async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          onCopy?.();
        } catch {
          // clipboard not available
        }
      }, [value, onCopy]);

Everything else in `copy-button.tsx` is unchanged.

Make `Installer` a client component that supplies the callback:

    // apps/web/components/installer.tsx — target (whole file)
    "use client";

    import { CopyButton } from "@vernostudio/design-system/components/copy-button";
    import { usePostHog } from "posthog-js/react";

    interface InstallerProps {
      readonly command: string;
    }

    export const Installer = ({ command }: InstallerProps) => {
      const posthog = usePostHog();

      return (
        <div className="flex w-full items-center material-medium gap-3 py-1.5 pr-1.5 pl-4">
          <span aria-hidden className="select-none text-gray-600">
            $
          </span>
          <pre className="flex-1 truncate">
            <code className="shimmer select-all text-gray-900">{command}</code>
          </pre>
          <CopyButton
            aria-label="Copy install command"
            onCopy={() => posthog.capture("install_command_copied", { command })}
            value={command}
          />
        </div>
      );
    };

## Repo conventions to follow

- `usePostHog` is exported from `posthog-js/react`
  (`posthog-js/react/dist/types/index.d.ts:37`) and returns a `PostHog`. The
  provider is already mounted at `apps/web/app/layout.tsx:88`, so the hook
  resolves anywhere under it.
- Props interfaces in `apps/web` use `readonly` members — see
  `apps/web/components/installer.tsx:3-5` and `apps/web/app/global-error.tsx:7-9`.
- `CopyButton`'s existing `aria-label` at `copy-button.tsx:47` is placed _before_
  `{...props}`, so a caller-supplied `aria-label` still wins. Preserve that
  ordering.
- Event names in this repo are snake_case (`install_command_copied`).
- Object keys and JSX attributes are sorted alphabetically by the lint preset.
  Run `bun run format` after editing rather than hand-sorting.

## Steps

1. In `packages/design-system/components/copy-button.tsx`, add an optional
   `onCopy` member to `CopyButtonProps`, destructure `onCopy`, call `onCopy?.()`
   immediately after `setCopied(true)`, and add `onCopy` to the `useCallback`
   dependency array.
2. Replace `apps/web/components/installer.tsx` with the Target block above. Note
   this **removes** the dead `data-track` attribute.
3. Leave `apps/web/components/story.tsx:24` alone — it passes only a `command`
   string, which is serializable across the server/client boundary.
4. Run `bun run format`, then re-read the diff and remove unrelated churn.

## Boundaries

- Do NOT add `posthog-js` (or any dependency) to
  `packages/design-system/package.json`. The design system stays
  analytics-agnostic; the callback is the seam.
- Do NOT make `story.tsx` a client component. Only `Installer` gets the
  `"use client"` directive.
- Do NOT fire `onCopy` when the clipboard write throws — it must stay inside the
  `try`, after `setCopied(true)`.
- Do NOT change the visual output of either component.
- STOP if either file no longer matches the "current" excerpts above; report the
  drift instead of improvising.

## Verification

- **Mechanical**:
  - `npx react-doctor@latest --verbose --scope changed` — score stays at 100. In
    particular confirm no `jsx-no-new-function-as-prop` diagnostic appears for
    the inline `onCopy` arrow; if it does, hoist it into a `useCallback` keyed on
    `[posthog, command]`.
  - `bun run typecheck`, `bun run lint`, `bun run test`.
  - `grep -rn "data-track" apps packages` returns nothing.
- **Behavior check**:
  1. `bun run dev`, load `/`.
  2. Click the copy button next to `bunx @vernostudio/cli create`. Confirm the
     icon still swaps to the checkmark and reverts after 2s, and that the command
     is actually on the clipboard.
  3. In DevTools → Network, filter for the PostHog host and confirm one
     `install_command_copied` event with a `command` property.
  4. Confirm `Installer` being a client component did not turn `Story` into one:
     in the built output, `story.tsx`'s prose must still render without JS.
- **Done when**: the named event fires once per successful copy, the copy UI is
  visually unchanged, no dead `data-track` remains, and all mechanical checks
  pass.
