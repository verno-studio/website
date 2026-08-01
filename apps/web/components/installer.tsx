import { CopyButton } from "@vernostudio/design-system/components/copy-button";

interface InstallerProps {
  readonly command: string;
}

export const Installer = ({ command }: InstallerProps) => (
  <div className="flex w-full items-center material-medium gap-3 py-1.5 pr-1.5 pl-4">
    <span aria-hidden className="select-none text-gray-600">
      $
    </span>
    <pre className="flex-1 truncate">
      <code className="shimmer select-all text-gray-900">{command}</code>
    </pre>
    <CopyButton
      value={command}
      aria-label="Copy install command"
      data-track="install_command_copied"
    />
  </div>
);
