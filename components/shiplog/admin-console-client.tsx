'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Component, IncidentWithUpdates, RegionId, Severity, WriteResult } from '@/lib/types';
import { MOCK_INCIDENTS, MOCK_COMPONENTS } from '@/lib/mock-data';
import { formatRelative } from '@/lib/format';
import { RegionBadge } from './region-badge';
import { IncidentStatusBadge, SeverityBadge } from './incident-badges';
import { StatusDot } from './status-pill';
import { MockBanner } from './mock-banner';

const COMPONENT_STATUSES = [
  { value: 'operational', label: 'Operational' },
  { value: 'degraded', label: 'Degraded' },
  { value: 'partial_outage', label: 'Partial Outage' },
  { value: 'major_outage', label: 'Major Outage' },
  { value: 'maintenance', label: 'Maintenance' },
] as const;

type ComponentConfirm = {
  region: RegionId;
  retries: number;
  error?: string;
};

export function AdminConsoleClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const region = (searchParams.get('region') as RegionId) || 'us-east-1';

  const [incidents, setIncidents] = useState<IncidentWithUpdates[]>(MOCK_INCIDENTS);
  const [components, setComponents] = useState<Component[]>(MOCK_COMPONENTS);
  const [showDeclare, setShowDeclare] = useState(false);
  const [componentConfirms, setComponentConfirms] = useState<Record<string, ComponentConfirm>>({});

  // Declare incident form state
  const [declareTitle, setDeclareTitle] = useState('');
  const [declareMessage, setDeclareMessage] = useState('');
  const [declareSeverity, setDeclareSeverity] = useState<Severity>('minor');
  const [declareAuthor, setDeclareAuthor] = useState('');
  const [declaring, setDeclaring] = useState(false);

  useEffect(() => {
    fetch('/api/incident')
      .then((r) => r.json())
      .then(setIncidents)
      .catch(() => {});

    fetch(`/api/status?region=${region}`)
      .then((r) => r.json())
      .then((d) => setComponents(d.components))
      .catch(() => {});
  }, [region]);

  async function handleDeclare(e: React.FormEvent) {
    e.preventDefault();
    setDeclaring(true);
    try {
      const res = await fetch(`/api/incident?region=${region}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: declareTitle,
          message: declareMessage,
          severity: declareSeverity,
          author: declareAuthor,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/admin/incident/${data.incident.id}?region=${region}`);
    } catch {
      setDeclaring(false);
    }
  }

  async function handleComponentChange(componentId: string, status: string) {
    try {
      const res = await fetch(`/api/component?region=${region}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ component_id: componentId, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const result: WriteResult = data.result;
      setComponents((prev) =>
        prev.map((c) => (c.id === componentId ? data.component : c))
      );
      setComponentConfirms((prev) => ({
        ...prev,
        [componentId]: { region: result.region, retries: result.retries },
      }));
    } catch (err) {
      setComponentConfirms((prev) => ({
        ...prev,
        [componentId]: {
          region,
          retries: 0,
          error: err instanceof Error ? err.message : 'Write failed',
        },
      }));
    }
  }

  return (
    <div className="space-y-6">
      <MockBanner />

      {/* Declare Incident */}
      <section aria-labelledby="declare-heading">
        <div className="flex items-center justify-between mb-3">
          <h2 id="declare-heading" className="font-semibold text-[#0f172a]">
            Declare Incident
          </h2>
          <Button
            onClick={() => setShowDeclare((v) => !v)}
            variant="destructive"
            size="sm"
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            {showDeclare ? 'Cancel' : 'Declare incident'}
            {showDeclare ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </Button>
        </div>

        {showDeclare && (
          <form
            onSubmit={handleDeclare}
            className="rounded-2xl border border-border bg-white shadow-sm p-5 space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-[#0f172a] mb-1" htmlFor="inc-title">
                Title
              </label>
              <input
                id="inc-title"
                type="text"
                value={declareTitle}
                onChange={(e) => setDeclareTitle(e.target.value)}
                required
                placeholder="Brief description of the incident"
                className="w-full h-9 px-3 rounded-lg border border-border bg-white text-sm text-[#0f172a] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-[#16a34a] transition"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium text-[#0f172a] mb-1"
                htmlFor="inc-message"
              >
                First update
              </label>
              <textarea
                id="inc-message"
                value={declareMessage}
                onChange={(e) => setDeclareMessage(e.target.value)}
                required
                rows={3}
                placeholder="What do we know so far? Who is investigating?"
                className="w-full px-3 py-2 rounded-lg border border-border bg-white text-sm text-[#0f172a] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-[#16a34a] transition resize-none"
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[140px]">
                <label
                  className="block text-sm font-medium text-[#0f172a] mb-1"
                  htmlFor="inc-severity"
                >
                  Severity
                </label>
                <select
                  id="inc-severity"
                  value={declareSeverity}
                  onChange={(e) => setDeclareSeverity(e.target.value as Severity)}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-white text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-[#16a34a]"
                >
                  <option value="minor">Minor</option>
                  <option value="major">Major</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div className="flex-1 min-w-[140px]">
                <label
                  className="block text-sm font-medium text-[#0f172a] mb-1"
                  htmlFor="inc-author"
                >
                  Your name
                </label>
                <input
                  id="inc-author"
                  type="text"
                  value={declareAuthor}
                  onChange={(e) => setDeclareAuthor(e.target.value)}
                  placeholder="On-call engineer"
                  className="w-full h-9 px-3 rounded-lg border border-border bg-white text-sm text-[#0f172a] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-[#16a34a] transition"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                Writing from <RegionBadge region={region} size="sm" />
              </p>
              <Button
                type="submit"
                disabled={declaring}
                className="bg-[#dc2626] hover:bg-red-700 text-white"
                size="sm"
              >
                {declaring ? 'Declaring…' : 'Declare'}
              </Button>
            </div>
          </form>
        )}
      </section>

      {/* Incidents list */}
      <section aria-labelledby="incidents-list-heading">
        <h2
          id="incidents-list-heading"
          className="font-semibold text-sm text-[#0f172a] uppercase tracking-wide mb-3"
        >
          All Incidents
        </h2>
        <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
          {incidents.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted-foreground text-center">
              No incidents. All clear.
            </p>
          ) : (
            <ul className="divide-y divide-border" role="list">
              {incidents.map((incident) => (
                <li key={incident.id}>
                  <Link
                    href={`/admin/incident/${incident.id}?region=${region}`}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <IncidentStatusBadge status={incident.status} />
                      <SeverityBadge severity={incident.severity} />
                      <span className="text-sm font-medium text-[#0f172a] truncate">
                        {incident.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                      <span>opened from</span>
                      {incident.created_region && (
                        <RegionBadge region={incident.created_region} size="sm" showLabel={false} />
                      )}
                      <span aria-hidden="true">·</span>
                      <span>{formatRelative(incident.started_at)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Component status controls */}
      <section aria-labelledby="component-status-heading">
        <h2
          id="component-status-heading"
          className="font-semibold text-sm text-[#0f172a] uppercase tracking-wide mb-3"
        >
          Component Status
        </h2>
        <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
          <ul className="divide-y divide-border" role="list">
            {[...components]
              .sort((a, b) => a.display_order - b.display_order)
              .map((component) => {
                const confirm = componentConfirms[component.id];
                return (
                  <li
                    key={component.id}
                    className="px-5 py-3.5 flex flex-wrap items-center gap-3"
                  >
                    <StatusDot status={component.status} />
                    <span className="text-sm font-medium text-[#0f172a] flex-1 min-w-[100px]">
                      {component.name}
                    </span>
                    <select
                      aria-label={`Set status for ${component.name}`}
                      value={component.status}
                      onChange={(e) => handleComponentChange(component.id, e.target.value)}
                      className="h-8 px-2 rounded-lg border border-border bg-white text-xs text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#16a34a]"
                    >
                      {COMPONENT_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    {confirm && (
                      <span
                        className={`font-mono text-xs ${
                          confirm.error ? 'text-red-600' : 'text-[#16a34a]'
                        }`}
                      >
                        {confirm.error
                          ? `✗ ${confirm.error}`
                          : confirm.retries > 0
                          ? `✓ ${confirm.region} · retried ${confirm.retries}×`
                          : `✓ ${confirm.region} · consistent`}
                      </span>
                    )}
                  </li>
                );
              })}
          </ul>
          <div className="px-5 py-3 border-t border-border bg-slate-50">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              Writing as <RegionBadge region={region} size="sm" />
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
