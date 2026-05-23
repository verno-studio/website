/** Project metadata directory written by `verno create` / `verno init`. */
export const VERNO_MANIFEST_DIR = ".verno" as const;

/** Sync with `packages/template-generator/templates/frontends/next/app/globals.css.hbs`. */
export const VERNO_APP_GLOBALS_BASE_MARKER = "/* This layer is by Verno Studio */" as const;

export const VERNO_APP_GLOBALS_BASE_LAYER = `${VERNO_APP_GLOBALS_BASE_MARKER}
@layer base {
  ::after,
  ::before,
  ::backdrop,
  ::file-selector-button {
    @apply border-border;
  }
  ::selection {
    @apply bg-primary text-background;
  }
  * {
    @apply border-border outline-ring/50;
  }
  html {
    font-feature-settings: "ss01";
    text-rendering: optimizeLegibility;
  }
  body {
    @apply min-h-dvh;
    @apply bg-background text-foreground;
  }
  input::placeholder,
  textarea::placeholder {
    @apply text-muted-foreground;
  }
  button:not(:disabled),
  [role="button"]:not(:disabled) {
    @apply cursor-pointer;
  }
  a[target="_blank"],
  a[target="_blank"] *,
  a[href^="mailto:"],
  a[href^="mailto:"] * {
    @apply cursor-alias;
  }
  button:focus,
  input:focus,
  textarea:focus,
  a:focus {
    @apply focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background;
  }
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      scroll-behavior: auto !important;
      transition-duration: 0.01ms !important;
    }
  }
}
`;

export const VERNO_INITIAL_COMMIT_SUBJECT = "Initial commit from Verno Studio" as const;
export const VERNO_INITIAL_COMMIT_BODY = "Generated-by: Verno Studio" as const;
