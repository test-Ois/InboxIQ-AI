'use client';

import { PageLoader } from '@/components/ui';

export default function Loading() {
  return (
    <PageLoader 
      text="Assembling task intelligence board" 
      subtitle="Running semantic scan for action items and checklist priorities..." 
    />
  );
}
