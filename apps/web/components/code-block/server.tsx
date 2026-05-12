import bash from "@shikijs/langs/bash";
import javascript from "@shikijs/langs/javascript";
import json from "@shikijs/langs/json";
import jsonc from "@shikijs/langs/jsonc";
import tsx from "@shikijs/langs/tsx";
import typescript from "@shikijs/langs/typescript";
import yaml from "@shikijs/langs/yaml";
import darkTheme from "@shikijs/themes/vesper";
import lightTheme from "@shikijs/themes/github-light-default";
import { cn } from "@vernostudio/design-system/lib/utils";
import type { BundledLanguage } from "shiki";
import { createHighlighterCore } from "shiki/core";
import { createOnigurumaEngine } from "shiki/engine/oniguruma";
import shikiWasm from "shiki/wasm";

interface CodeBlockProps {
  className?: string;
  code: string;
  lang: BundledLanguage;
}

let highlighterPromise: ReturnType<typeof createHighlighterCore> | null = null;

const getHighlighter = () => {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      // `shiki/wasm` contains the wasm binary inlined as base64 string.
      engine: createOnigurumaEngine(shikiWasm),
      langs: [javascript, json, bash, typescript, jsonc, tsx, yaml],
      themes: [lightTheme, darkTheme],
    });
  }
  return highlighterPromise;
};

export const CodeBlock = async ({ code, lang, className }: CodeBlockProps) => {
  const highlighter = await getHighlighter();

  const result = highlighter.codeToTokens(code, {
    lang,
    themes: {
      dark: darkTheme,
      light: lightTheme,
    },
  });

  return (
    <pre
      className={cn(className, "overflow-x-auto rounded-lg bg-sidebar p-6 text-sm")}
      data-language={lang}
      style={{ color: result.fg }}
    >
      <code>
        {result.tokens.map((row, index) => (
          <span
            className="block min-h-lh"
            // eslint-disable-next-line react/no-array-index-key -- tokens have no unique ID
            key={`line-${String(index)}`}
          >
            {row.map((token, tokenIndex) => (
              <span
                // eslint-disable-next-line react/no-array-index-key -- tokens have no unique ID
                key={`token-${String(index)}-${String(tokenIndex)}`}
                style={{
                  backgroundColor: token.bgColor,
                  color: token.color,
                  ...token.htmlStyle,
                }}
                {...token.htmlAttrs}
              >
                {token.content}
              </span>
            ))}
          </span>
        ))}
      </code>
    </pre>
  );
};
