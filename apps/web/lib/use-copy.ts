"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Write `value` to the clipboard and hold a success flag for two seconds, long
 * enough for a button to swap its icon and settle back on its own. `value` may
 * be a function for anything only readable in the browser, such as the URL of
 * the page the button happens to be on.
 */
export const useCopy = (value: string | (() => string)) => {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(typeof value === "function" ? value() : value);
      setCopied(true);
      return true;
    } catch {
      // clipboard not available
      return false;
    }
  }, [value]);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timer = setTimeout(() => {
      setCopied(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [copied]);

  return { copied, copy };
};
