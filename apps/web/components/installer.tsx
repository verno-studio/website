import { CodeBlock } from "./code-block";
import { CopyButton } from "./copy-button";

interface InstallerProps {
  command: string;
}

export const Installer = ({ command }: InstallerProps) => (
  <div className="relative w-full overflow-hidden bg-card rounded-lg shadow-sm">
    <CodeBlock code={command} lang="bash" />
    <CopyButton value={command} className="absolute right-5 top-5" />
  </div>
);
