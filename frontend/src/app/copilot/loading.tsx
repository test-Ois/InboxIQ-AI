'use client';

import { PageLoader } from '@/components/ui';

export default function Loading() {
  return (
    <PageLoader 
      text="Syncing copilot intelligence" 
      subtitle="Spinning up language models and RAG index nodes..." 
    />
  );
}
