"use client";

import { Button } from "@vernostudio/design-system/components/ui/button";
import { cn } from "@vernostudio/design-system/lib/utils";
import { Check, Copy } from "lucide-react";
import { useCallback, useState } from "react";
import type { ComponentProps } from "react";
import { toast } from "sonner";

const COPY_TIMEOUT = 2000;

interface CopyButtonProps extends ComponentProps<typeof Button> {
  value: string;
}

export const CopyButton = ({ value, className, variant = "ghost", ...props }: CopyButtonProps) => {
  const [hasCopied, setHasCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value);
    setHasCopied(true);
    toast.success("Copied to clipboard", {
      description: "Paste it into your terminal to install Verno Studio.",
    });

    setTimeout(() => {
      setHasCopied(false);
    }, COPY_TIMEOUT);
  }, [value]);

  return (
    <Button
      data-slot="copy-button"
      data-copied={hasCopied}
      size="icon"
      variant={variant}
      className={cn(
        "absolute top-3 right-2 z-10 grid size-8 place-items-center rounded-md text-muted-foreground hover:text-foreground",
        className,
      )}
      onClick={handleCopy}
      {...props}
    >
      <span className="sr-only">Copy</span>
      <Check
        className={cn(
          "absolute size-4 transition-all duration-200 ease-out will-change-transform",
          hasCopied ? "scale-100 opacity-100 blur-0" : "scale-95 opacity-0 blur-[2px]",
        )}
      />
      <Copy
        className={cn(
          "absolute size-4 transition-all duration-200 ease-out will-change-transform",
          hasCopied ? "scale-95 opacity-0 blur-[2px]" : "scale-100 opacity-100 blur-0",
        )}
      />
    </Button>
  );
};
