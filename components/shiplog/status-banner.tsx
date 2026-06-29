'use client';

import { CheckCircle, AlertTriangle } from 'lucide-react';
import type { Component, RegionId } from '@/lib/types';
import { RegionBadge } from './region-badge';

interface StatusBannerProps {
  components: Component[];
  servedRegion: RegionId;
  mock: boolean;
}

export function StatusBanner({ components, servedRegion, mock }: StatusBannerProps) {
  const allOperational = components.every((c) => c.status === 'operational');

  return (
    <div
      className={`rounded-2xl border shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        allOperational
          ? 'bg-white border-green-100'
          : 'bg-white border-amber-100'
      }`}
    >
      {/* Left side */}
      <div className="flex items-center gap-4">
        {allOperational ? (
          <div className="w-12 h-12 rounded-full bg-green-50 border border-green-100 flex items-center justify-center shrink-0">
            <CheckCircle className="w-6 h-6 text-[#16a34a]" aria-hidden="true" />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-amber-500" aria-hidden="true" />
          </div>
        )}
        <div>
          <h1 className="font-serif text-2xl font-semibold text-[#0f172a] text-balance">
            {allOperational
              ? 'All systems operational'
              : 'Some systems are experiencing issues'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span>Live</span>
            <span aria-hidden="true">·</span>
            <span>refreshed every 5s</span>
            <span aria-hidden="true">·</span>
            <span>served from</span>
            <RegionBadge region={servedRegion} size="sm" />
          </p>
        </div>
      </div>

      {/* Right side: live dot */}
      <div className="flex items-center gap-2 self-start sm:self-center">
        <span
          className="w-2 h-2 rounded-full bg-[#16a34a] pulse-live"
          aria-hidden="true"
        />
        <span className="text-xs font-medium text-[#16a34a]">live</span>
      </div>
    </div>
  );
}
