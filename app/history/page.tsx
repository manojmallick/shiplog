import { Suspense } from 'react';
import { TopNav } from '@/components/shiplog/top-nav';
import { UptimeBar } from '@/components/shiplog/uptime-bar';
import { getUptime } from '@/lib/queries';
import type { RegionId } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function parseRegion(v: string | string[] | undefined): RegionId {
  return v === 'ap-southeast-1' ? 'ap-southeast-1' : 'us-east-1';
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const uptimes = await getUptime(parseRegion(sp.region));

  return (
    <div className="min-h-screen bg-background">
      <Suspense>
        <TopNav />
      </Suspense>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-semibold text-[#0f172a]">Uptime history</h1>
          <p className="text-sm text-muted-foreground mt-1">
            90-day uptime per component. Each bar is one day — hover for the exact figure.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mb-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#16a34a] inline-block" />
            &ge;99.9%
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#d97706] inline-block" />
            &ge;99%
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#ea580c] inline-block" />
            &ge;95%
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#dc2626] inline-block" />
            {'<95%'}
          </span>
        </div>

        <div className="space-y-4">
          {uptimes.map((uptime) => (
            <UptimeBar key={uptime.component_id} data={uptime} />
          ))}
          {uptimes.length === 0 && (
            <p className="text-sm text-muted-foreground">No uptime data yet.</p>
          )}
        </div>
      </main>
    </div>
  );
}
