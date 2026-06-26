'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Premium 3-bar loading animation.
 * Bar 1 & 3 are shorter, bar 2 (middle) is taller.
 * Stagger: 0s → 0.25s → 0.5s (exact match of reference).
 * On active peak (20% keyframe): violet/purple gradient + glow.
 */
export const Loader = React.memo(({ size = 'md', className, ...props }: LoaderProps) => {
  const sizeKey = `pbl-${size}`;

  return (
    <div
      role="status"
      aria-busy="true"
      className={cn('inline-flex items-center justify-center', className)}
      {...props}
    >
      {/* Bar 1 — short */}
      <span className={`pbl-bar ${sizeKey}`} />

      {/* Bar 2 — middle (taller) */}
      <span className={`pbl-bar pbl-mid ${sizeKey}`} />

      {/* Bar 3 — short */}
      <span className={`pbl-bar ${sizeKey}`} />

      <span className="sr-only">Loading…</span>
    </div>
  );
});

Loader.displayName = 'Loader';
