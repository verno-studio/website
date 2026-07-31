import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT = 768;

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") {
      return;
    }
    return window.innerWidth < MOBILE_BREAKPOINT;
  });

  useEffect(() => {
    // oxlint-disable-next-line react/react-compiler -- media-query subscription syncs external state; vendored shadcn hook
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return Boolean(isMobile);
};
