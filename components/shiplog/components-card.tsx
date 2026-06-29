'use client';

import type { Component } from '@/lib/types';
import { StatusDot, StatusPill } from './status-pill';

interface ComponentsCardProps {
  components: Component[];
  flashedIds?: Set<string>;
}

export function ComponentsCard({ components, flashedIds = new Set() }: ComponentsCardProps) {
  const sorted = [...components].sort((a, b) => a.display_order - b.display_order);

  return (
    <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="font-semibold text-sm text-[#0f172a] uppercase tracking-wide">
          System Components
        </h2>
      </div>
      <ul className="divide-y divide-border" role="list">
        {sorted.map((component) => (
          <li
            key={component.id}
            className={`px-5 py-3.5 flex items-center justify-between gap-4 transition-colors ${
              flashedIds.has(component.id) ? 'flash-update' : ''
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <StatusDot status={component.status} />
              <span className="text-sm font-medium text-[#0f172a] truncate">
                {component.name}
              </span>
            </div>
            <StatusPill status={component.status} size="sm" />
          </li>
        ))}
      </ul>
    </div>
  );
}
