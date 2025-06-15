import type React from "react"
import { cn } from "@/lib/utils"

interface ShellProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  variant?: "default" | "sidebar" | "centered" | "markdown"
  as?: React.ElementType
}

export function Shell({ children, variant = "default", className, as: Comp = "div", ...props }: ShellProps) {
  return (
    <Comp
      className={cn(
        "grid items-start gap-8 pb-8 pt-6 md:py-8",
        variant === "default" && "container",
        variant === "sidebar" &&
          "container grid-cols-[220px_minmax(0,1fr)] gap-12 md:grid-cols-[240px_minmax(0,1fr)] lg:gap-24",
        variant === "centered" && "container max-w-2xl",
        variant === "markdown" && "container max-w-3xl py-8 md:py-10 lg:py-10",
        className,
      )}
      {...props}
    >
      {children}
    </Comp>
  )
}
