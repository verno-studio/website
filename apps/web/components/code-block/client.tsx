"use client";

import darkTheme from "@shikijs/themes/vesper";
import lightTheme from "@shikijs/themes/github-light-default";
import { cn } from "@vernostudio/design-system/lib/utils";
import { useEffect, useState } from "react";
import type { BundledLanguage, HighlighterCore, ThemedToken } from "shiki";
import { createHighlighterCore } from "shiki/core";
import { createOnigurumaEngine } from "shiki/engine/oniguruma";
import shikiWasm from "shiki/wasm";

interface CodeBlockProps {
  className?: string;
  code: string;
  lang: BundledLanguage;
}

interface TokenResult {
  bg?: string;
  fg?: string;
  tokens: ThemedToken[][];
}

const langLoaders: Record<string, () => Promise<unknown>> = {
  bash: () => import("@shikijs/langs/bash"),
  javascript: () => import("@shikijs/langs/javascript"),
  json: () => import("@shikijs/langs/json"),
  jsonc: () => import("@shikijs/langs/jsonc"),
  markdown: () => import("@shikijs/langs/markdown"),
  tsx: () => import("@shikijs/langs/tsx"),
  typescript: () => import("@shikijs/langs/typescript"),
  yaml: () => import("@shikijs/langs/yaml"),
};

let highlighterPromise: Promise<HighlighterCore> | null = null;

const getHighlighter = () => {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      engine: createOnigurumaEngine(shikiWasm),
      langs: [],
      themes: [lightTheme, darkTheme],
    });
  }
  return highlighterPromise;
};

const loadedLangs = new Set<string>();

const ensureLang = async (highlighter: HighlighterCore, lang: string): Promise<void> => {
  if (loadedLangs.has(lang)) {
    return;
  }
  const loader = langLoaders[lang];
  if (loader) {
    const mod = await loader();
    await highlighter.loadLanguage(
      (mod as { default: unknown }).default as Parameters<HighlighterCore["loadLanguage"]>[0],
    );
    loadedLangs.add(lang);
  }
};

export const CodeBlock = ({ code, lang, className }: CodeBlockProps) => {
  const [result, setResult] = useState<TokenResult | null>(null);

  useEffect(() => {
    let cancelled = false;

    const highlight = async () => {
      const highlighter = await getHighlighter();
      await ensureLang(highlighter, lang);

      if (cancelled) {
        return;
      }

      const tokens = highlighter.codeToTokens(code, {
        lang,
        themes: {
          dark: darkTheme,
          light: lightTheme,
        },
      });

      setResult(tokens);
    };

    highlight();

    return () => {
      cancelled = true;
    };
  }, [code, lang]);

  const output: ThemedToken[][] = result
    ? result.tokens
    : code.split("\n").map((line) => [
        {
          bgColor: "var(--shiki-light-bg)",
          color: "var(--shiki-light-fg)",
          content: line,
          htmlAttrs: {},
          htmlStyle: {},
          offset: 0,
        },
      ]);

  return (
    <pre
      className={cn(className, "p-4 text-sm bg-sidebar")}
      data-language={lang}
      style={{
        backgroundColor: result?.bg,
        color: result?.fg,
      }}
    >
      <code>
        {output.map((row, index) => (
          <span
            className="block min-h-lh font-mono"
            // eslint-disable-next-line react/no-array-index-key -- tokens have no unique ID
            key={`line-${String(index)}`}
          >
            {row.map((token, tokenIndex) => (
              <span
                className="dark:bg-(--shiki-dark-bg)! dark:text-(--shiki-dark)!"
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
