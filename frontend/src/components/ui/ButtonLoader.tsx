'use client';

import React from 'react';
import { Loader } from './Loader';
import { cn } from '@/lib/utils';

export interface ButtonLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  show?: boolean;
  children: React.ReactNode;
}

export const ButtonLoader = React.memo(({
  show = false,
  children,
  className,
  ...props
}: ButtonLoaderProps) => {
  return (
    <div
      className={cn('relative inline-flex items-center justify-center w-full h-full', className)}
      {...props}
    >
      {/* Invisible content wrapper to maintain exact width & height */}
      <div
        className={cn(
          'flex items-center justify-center gap-2 transition-opacity duration-250 ease-out',
          show ? 'opacity-0 pointer-events-none' : 'opacity-100'
        )}
      >
        {children}
      </div>

      {/* Absolute positioned loader overlay */}
      {show && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader size="sm" />
        </div>
      )}
    </div>
  );
});

ButtonLoader.displayName = 'ButtonLoader';
