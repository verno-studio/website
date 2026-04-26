export const gitignoreContent = `node_modules
.next
out
.turbo
dist
.env
.env*.local
.DS_Store
*.tsbuildinfo
`;

export const editorConfig = `root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
`;

export { packageManagerField } from "./catalog/tooling";
