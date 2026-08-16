"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface DialogProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
  contentClassName?: string
  maxWidth?: string
}

export function Dialog({
  isOpen,
  onClose,
  children,
  className,
  contentClassName,
  maxWidth = "max-w-lg",
}: DialogProps) {
  React.useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto",
        className
      )}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Dialog Panel */}
      <div
        className={cn(
          "relative w-full rounded-2xl border border-border/80 bg-card text-card-foreground shadow-2xl p-6 sm:p-7 z-10 animate-in fade-in zoom-in-95 duration-200",
          maxWidth,
          contentClassName
        )}
      >
        {children}
      </div>
    </div>
  )
}

export function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col space-y-1.5 text-left mb-5",
        className
      )}
      {...props}
    />
  )
}

export function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4 border-t border-border/50 mt-6",
        className
      )}
      {...props}
    />
  )
}

export function DialogTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn(
        "text-lg font-bold tracking-tight text-foreground flex items-center gap-2",
        className
      )}
      {...props}
    />
  )
}

export function DialogDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-xs text-muted-foreground leading-relaxed", className)}
      {...props}
    />
  )
}

export function DialogClose({
  onClose,
  className,
}: {
  onClose: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClose}
      className={cn(
        "absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground/80 hover:text-foreground hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      aria-label="Close"
    >
      <X className="size-4" />
    </button>
  )
}
