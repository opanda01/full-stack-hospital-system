import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/shared/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground border-border",
        kritik:
          "border-transparent bg-[var(--status-kritik-bg)] text-[var(--status-kritik-fg)]",
        acil:
          "border-transparent bg-[var(--status-acil-bg)] text-[var(--status-acil-fg)]",
        beklemede:
          "border-transparent bg-[var(--status-beklemede-bg)] text-[var(--status-beklemede-fg)]",
        tamamlandi:
          "border-transparent bg-[var(--status-tamamlandi-bg)] text-[var(--status-tamamlandi-fg)]",
        iptal:
          "border-transparent bg-[var(--status-iptal-bg)] text-[var(--status-iptal-fg)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
