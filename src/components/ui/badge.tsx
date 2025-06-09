import * as React from "react"
import { cn } from "@/lib/utils"

const badgeVariants = {
  default: "inline-flex items-center rounded-full border border-transparent bg-slate-900 px-2.5 py-0.5 text-xs font-semibold text-slate-50",
  secondary: "inline-flex items-center rounded-full border border-transparent bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-900",
  destructive: "inline-flex items-center rounded-full border border-transparent bg-red-500 px-2.5 py-0.5 text-xs font-semibold text-white",
  outline: "inline-flex items-center rounded-full border border-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-900",
}

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof badgeVariants
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants[variant], className)} {...props} />
  )
}

export { Badge }