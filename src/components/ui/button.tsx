import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ComponentProps<"button"> {
  variant?: "default" | "secondary" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
        {
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90":
            variant === "default",
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80":
            variant === "secondary",
          "border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground":
            variant === "outline",
          "hover:bg-accent hover:text-accent-foreground": variant === "ghost",
        },
        {
          "h-9 px-4 py-2": size === "default",
          "h-8 rounded-md px-3 text-xs": size === "sm",
          "h-10 rounded-md px-8": size === "lg",
          "h-9 w-9": size === "icon",
        },
        className,
      )}
      {...props}
    />
  );
}

export { Button };
