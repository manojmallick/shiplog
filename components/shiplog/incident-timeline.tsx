import { formatRelative, formatUTC } from '@/lib/format';
import type { IncidentUpdate } from '@/lib/types';
import { IncidentStatusBadge } from './incident-badges';
import { RegionBadge } from './region-badge';

interface IncidentTimelineProps {
  updates: IncidentUpdate[];
}

export function IncidentTimeline({ updates }: IncidentTimelineProps) {
  if (updates.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">No updates yet.</p>
    );
  }

  return (
    <ol className="relative border-l border-border ml-3 space-y-0">
      {updates.map((update, i) => (
        <li key={update.id} className="ml-6 pb-7 last:pb-0">
          {/* Timeline dot */}
          <span
            className="absolute -left-[7px] w-3.5 h-3.5 rounded-full border-2 border-white bg-slate-300 shadow-sm"
            aria-hidden="true"
          />

          <div className="flex flex-col gap-2">
            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-2">
              {update.status && <IncidentStatusBadge status={update.status} />}
              {update.author_region && (
                <RegionBadge region={update.author_region} size="sm" />
              )}
              <span className="text-xs text-muted-foreground">
                {update.author && (
                  <span className="font-medium text-foreground">{update.author}</span>
                )}
                {update.author && ' · '}
                <span>{formatRelative(update.posted_at)}</span>
                <span className="ml-1 font-mono text-[10px] opacity-60">
                  {formatUTC(update.posted_at)}
                </span>
              </span>
            </div>

            {/* Message */}
            <p className="text-sm text-foreground leading-relaxed">{update.message}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
