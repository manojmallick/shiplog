'use client';

import Link from 'next/link';
import type { IncidentWithUpdates } from '@/lib/types';
import { formatRelative } from '@/lib/format';
import { IncidentStatusBadge, SeverityBadge } from './incident-badges';
import { IncidentTimeline } from './incident-timeline';

interface ActiveIncidentsProps {
  incidents: IncidentWithUpdates[];
}

export function ActiveIncidents({ incidents }: ActiveIncidentsProps) {
  const active = incidents.filter((i) => i.status !== 'resolved');

  if (active.length === 0) return null;

  return (
    <section aria-labelledby="active-incidents-heading">
      <h2
        id="active-incidents-heading"
        className="font-semibold text-sm text-[#0f172a] uppercase tracking-wide mb-3"
      >
        Active Incidents
      </h2>
      <div className="space-y-4">
        {active.map((incident) => (
          <div
            key={incident.id}
            className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 pt-5 pb-4">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <IncidentStatusBadge status={incident.status} />
                <SeverityBadge severity={incident.severity} />
              </div>
              <Link
                href={`/admin/incident/${incident.id}`}
                className="font-serif text-lg font-semibold text-[#0f172a] hover:text-[#16a34a] transition-colors leading-snug"
              >
                {incident.title}
              </Link>
              <p className="text-xs text-muted-foreground mt-1">
                Started {formatRelative(incident.started_at)}
              </p>
            </div>

            {/* Timeline */}
            {incident.updates.length > 0 && (
              <div className="px-5 pb-5 border-t border-border pt-4">
                <IncidentTimeline updates={incident.updates} />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
