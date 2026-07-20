import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/shared/lib";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline";
};

/** Minimal shadcn-benzeri Button iskeleti */
export function Button({ className, variant = "default", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors",
        variant === "default" && "bg-primary text-primary-foreground hover:opacity-90",
        variant === "outline" && "border border-border bg-transparent hover:bg-muted",
        className,
      )}
      {...props}
    />
  );
}
