'use client';

import React from 'react';
import { Loader } from './Loader';
import { cn } from '@/lib/utils';

export interface InlineLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  text?: string;
  size?: 'sm' | 'md';
}

export const InlineLoader = React.memo(({
  text,
  size = 'sm',
  className,
  ...props
}: InlineLoaderProps) => {
  return (
    <div
      className={cn('inline-flex items-center gap-2.5 text-zinc-400 font-sans text-xs', className)}
      {...props}
    >
      <Loader size={size} />
      {text && <span className="font-medium animate-pulse select-none">{text}</span>}
    </div>
  );
});

InlineLoader.displayName = 'InlineLoader';
