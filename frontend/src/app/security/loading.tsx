'use client';

import { PageLoader } from '@/components/ui';

export default function Loading() {
  return (
    <PageLoader 
      text="Running threat database scans" 
      subtitle="Verifying cryptographic signatures and phishing filters..." 
    />
  );
}
