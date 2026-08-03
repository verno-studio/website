import { File, FileTree, Folder } from "@vernostudio/design-system/components/file-tree";

/** What `verno create` writes for a Turborepo project, the tree the README draws in ASCII. */
export const Default = () => (
  <FileTree>
    <Folder defaultOpen name="apps">
      <Folder defaultOpen name="web">
        <Folder name="app">
          <File name="layout.tsx" />
          <File name="page.tsx" />
          <File name="globals.css" />
        </Folder>
        <File name="components.json" />
        <File name="package.json" />
      </Folder>
    </Folder>
    <Folder name="packages">
      <Folder name="typescript-config">
        <File name="base.json" />
        <File name="nextjs.json" />
      </Folder>
    </Folder>
    <File name="turbo.json" />
    <File name="package.json" />
  </FileTree>
);

export const Closed = () => (
  <FileTree>
    <Folder name="apps">
      <Folder name="web">
        <File name="package.json" />
      </Folder>
    </Folder>
    <Folder name="packages">
      <File name="README.md" />
    </Folder>
    <File name="turbo.json" />
  </FileTree>
);

export const Linked = () => (
  <FileTree>
    <Folder defaultOpen name="components">
      <File href="/components/json-view" name="json-view.tsx" />
      <File href="/components/file-tree" name="file-tree.tsx" />
    </Folder>
  </FileTree>
);
