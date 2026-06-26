'use client';

import { PageLoader } from '@/components/ui';

export default function Loading() {
  return (
    <PageLoader 
      text="Retrieving inbox streams" 
      subtitle="Decrypting credentials and synchronizing email indices..." 
    />
  );
}
