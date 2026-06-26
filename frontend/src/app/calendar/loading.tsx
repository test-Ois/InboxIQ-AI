'use client';

import { PageLoader } from '@/components/ui';

export default function Loading() {
  return (
    <PageLoader 
      text="Compiling scheduler timelines" 
      subtitle="Analyzing timezone offsets and slot conflict clusters..." 
    />
  );
}
