import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

interface AlertProps extends ComponentProps<"div"> {
  variant?: "default" | "destructive" | "warning";
}

function Alert({ className, variant = "default", ...props }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        "relative w-full rounded-lg border px-4 py-3 text-sm",
        {
          "bg-background text-foreground": variant === "default",
          "border-destructive/50 text-destructive bg-destructive/5":
            variant === "destructive",
          "border-slate-700 text-white bg-slate-800/90": variant === "warning",
        },
        className,
      )}
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("text-sm [&_p]:leading-relaxed", className)}
      {...props}
    />
  );
}

export { Alert, AlertDescription };
