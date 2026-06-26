'use client';

import { PageLoader } from '@/components/ui';

export default function Loading() {
  return (
    <PageLoader 
      text="Retrieving profile preferences" 
      subtitle="Loading user configurations and credentials indexes..." 
    />
  );
}
