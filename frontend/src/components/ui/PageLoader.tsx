'use client';

import React from 'react';
import { Loader } from './Loader';
import { cn } from '@/lib/utils';

export interface PageLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  text?: string;
  subtitle?: string;
  minHeight?: string;
}

export const PageLoader = React.memo(({
  text = 'Loading',
  subtitle,
  minHeight = 'min-h-[350px]',
  className,
  ...props
}: PageLoaderProps) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center font-sans',
        minHeight,
        className
      )}
      {...props}
    >
      <Loader size="md" />

      {text && (
        <p className="text-[12px] font-semibold text-zinc-500 mt-4 tracking-wide">
          {text}
        </p>
      )}

      {subtitle && (
        <p className="text-[11px] text-zinc-700 mt-1 max-w-xs leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
});

PageLoader.displayName = 'PageLoader';
