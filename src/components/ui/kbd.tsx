import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

function Kbd({ className, ...props }: ComponentProps<"kbd">) {
  return (
    <kbd
      className={cn(
        "inline-flex items-center justify-center rounded border border-border bg-muted px-1 font-sans text-[10px] text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Kbd };
