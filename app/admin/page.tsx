import { Suspense } from 'react';
import { TopNav } from '@/components/shiplog/top-nav';
import { AdminConsoleClient } from '@/components/shiplog/admin-console-client';

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-background">
      <Suspense>
        <TopNav />
      </Suspense>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-semibold text-[#0f172a]">On-call console</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Declare incidents, post updates, and manage component status.
          </p>
        </div>
        <Suspense>
          <AdminConsoleClient />
        </Suspense>
      </main>
    </div>
  );
}
