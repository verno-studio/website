"use client";

import { CopyButton } from "@vernostudio/design-system/components/copy-button";
import { usePostHog } from "posthog-js/react";
import { useCallback } from "react";

interface InstallerProps {
  readonly command: string;
}

export const Installer = ({ command }: InstallerProps) => {
  const posthog = usePostHog();

  const handleCopy = useCallback(() => {
    posthog.capture("install_command_copied", { command });
  }, [posthog, command]);

  return (
    <div className="flex w-full items-center material-medium gap-3 py-1.5 pr-1.5 pl-4">
      <span aria-hidden className="select-none text-gray-600">
        $
      </span>
      <pre className="flex-1 truncate">
        <code className="shimmer select-all text-gray-900">{command}</code>
      </pre>
      <CopyButton aria-label="Copy install command" onCopy={handleCopy} value={command} />
    </div>
  );
};
