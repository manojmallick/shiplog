import { Suspense } from 'react';
import Link from 'next/link';
import { TopNav } from '@/components/shiplog/top-nav';
import { StatusPageClient } from '@/components/shiplog/status-page-client';

export default function StatusPage() {
  return (
    <div className="min-h-screen bg-background">
      <Suspense>
        <TopNav />
      </Suspense>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <Suspense>
          <StatusPageClient />
        </Suspense>

        {/* Footer */}
        <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <Link
            href="/history"
            className="hover:text-[#16a34a] transition-colors font-medium"
          >
            View 90-day uptime history &rarr;
          </Link>
          <p className="font-mono">ShipLog &mdash; powered by Aurora DSQL</p>
        </div>
      </main>
    </div>
  );
}
