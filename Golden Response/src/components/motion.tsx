import * as React from "react";
import { cn } from "@/lib/utils";

// Subtle fade-and-rise for cards and sections. Driven by CSS so the content is
// present and visible the moment the HTML paints — the animation enhances it
// rather than gating visibility on JS. prefers-reduced-motion is honored by the
// global safety net in globals.css.
export function FadeRise({
  children,
  delay = 0,
  className,
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { delay?: number }) {
  return (
    <div
      className={cn("ink-fade-rise", className)}
      style={{ animationDelay: delay ? `${delay}s` : undefined, ...style }}
      {...props}
    >
      {children}
    </div>
  );
}

// Page-level mount transition for content that's already in view.
export function PageFade({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("ink-page-fade", className)}>{children}</div>;
}
