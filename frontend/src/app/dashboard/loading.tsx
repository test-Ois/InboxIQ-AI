'use client';

import { PageLoader } from '@/components/ui';

export default function Loading() {
  return (
    <PageLoader 
      text="Syncing dashboard workspace" 
      subtitle="Fetching connected account states and analytical counters..." 
    />
  );
}
