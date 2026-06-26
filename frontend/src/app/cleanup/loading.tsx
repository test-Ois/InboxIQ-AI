'use client';

import { PageLoader } from '@/components/ui';

export default function Loading() {
  return (
    <PageLoader 
      text="Analyzing storage segments" 
      subtitle="Locating redundant attachments, promotions, and junk blocks..." 
    />
  );
}
