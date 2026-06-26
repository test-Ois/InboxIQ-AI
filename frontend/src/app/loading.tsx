'use client';

import { PageLoader } from '@/components/ui';

export default function Loading() {
  return (
    <PageLoader 
      text="Initializing secure gateway" 
      subtitle="Loading your enterprise security environment..." 
      minHeight="min-h-screen"
    />
  );
}
