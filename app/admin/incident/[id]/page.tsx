import { Suspense } from 'react';
import { TopNav } from '@/components/shiplog/top-nav';
import { IncidentDetailClient } from '@/components/shiplog/incident-detail-client';

export default async function IncidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-background">
      <Suspense>
        <TopNav />
      </Suspense>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <Suspense>
          <IncidentDetailClient incidentId={id} />
        </Suspense>
      </main>
    </div>
  );
}
