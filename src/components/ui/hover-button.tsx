import * as React from 'react';
import { cn } from '@/lib/utils';

// HoverButton — same global `.btn` chrome with four cyan L-brackets that
// snap into place on hover. Mirrors the corner-bracket motif used on the
// dashboard frame, scene cards, and floor plan — a recurring drawing-tag
// crosshair that signals "selected" / "active" in this design system.
// No cursor tracking, no inertia: just opacity + transform on hover.

interface HoverButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const HoverButton = React.forwardRef<HTMLButtonElement, HoverButtonProps>(
  ({ className, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn('btn hover-button', className)}
      {...props}
    >
      <span className="hover-corner hover-corner-tl" aria-hidden />
      <span className="hover-corner hover-corner-tr" aria-hidden />
      <span className="hover-corner hover-corner-bl" aria-hidden />
      <span className="hover-corner hover-corner-br" aria-hidden />
      {children}
    </button>
  ),
);
HoverButton.displayName = 'HoverButton';
