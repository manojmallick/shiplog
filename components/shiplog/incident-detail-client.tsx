'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { IncidentStatus, IncidentWithUpdates, RegionId } from '@/lib/types';
import { formatRelative, formatUTCFull } from '@/lib/format';
import { RegionBadge } from './region-badge';
import { IncidentStatusBadge, SeverityBadge } from './incident-badges';
import { IncidentTimeline } from './incident-timeline';

const UPDATE_STATUSES: { value: IncidentStatus | ''; label: string }[] = [
  { value: '', label: '— keep status —' },
  { value: 'investigating', label: 'Investigating' },
  { value: 'identified', label: 'Identified' },
  { value: 'monitoring', label: 'Monitoring' },
  { value: 'resolved', label: 'Resolved' },
];

type PostResult =
  | { type: 'success'; region: RegionId; retries: number }
  | { type: 'conflict' }
  | { type: 'error'; message: string }
  | null;

interface IncidentDetailClientProps {
  incidentId: string;
}

export function IncidentDetailClient({ incidentId }: IncidentDetailClientProps) {
  const searchParams = useSearchParams();
  const region = (searchParams.get('region') as RegionId) || 'us-east-1';

  const [incident, setIncident] = useState<IncidentWithUpdates | null>(null);
  const [loading, setLoading] = useState(true);

  // Update form state
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<IncidentStatus | ''>('');
  const [author, setAuthor] = useState('');
  const [posting, setPosting] = useState(false);
  const [postResult, setPostResult] = useState<PostResult>(null);

  async function loadIncident() {
    try {
      const res = await fetch(`/api/incident/${incidentId}`);
      if (!res.ok) return;
      setIncident(await res.json());
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadIncident();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidentId]);

  async function handlePostUpdate(e: React.FormEvent) {
    e.preventDefault();
    setPosting(true);
    setPostResult(null);

    try {
      const res = await fetch(`/api/update?region=${region}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incident_id: incidentId,
          message,
          status: status || null,
          author,
        }),
      });

      if (res.status === 409) {
        setPostResult({ type: 'conflict' });
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        setPostResult({ type: 'error', message: data.error || 'Write failed' });
        return;
      }

      setPostResult({
        type: 'success',
        region: data.result.region,
        retries: data.result.retries,
      });

      setMessage('');
      setStatus('');
      setIncident(data.incident);
    } catch (err) {
      setPostResult({
        type: 'error',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setPosting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-4 w-32 bg-slate-200 rounded" />
        <div className="h-8 w-2/3 bg-slate-200 rounded" />
        <div className="h-40 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Incident not found.</p>
        <Link href={`/admin?region=${region}`} className="text-sm text-[#16a34a] mt-2 inline-block">
          &larr; Back to console
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href={`/admin?region=${region}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[#0f172a] transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
        Console
      </Link>

      {/* Incident header */}
      <div className="rounded-2xl border border-border bg-white shadow-sm p-6 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <IncidentStatusBadge status={incident.status} />
          <SeverityBadge severity={incident.severity} />
          {incident.created_region && (
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              opened from <RegionBadge region={incident.created_region} size="sm" />
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            &middot; {formatRelative(incident.started_at)}
          </span>
        </div>
        <h1 className="font-serif text-2xl font-semibold text-[#0f172a] leading-snug">
          {incident.title}
        </h1>
        {incident.resolved_at && (
          <p className="text-xs text-muted-foreground font-mono">
            Resolved {formatUTCFull(incident.resolved_at)}
          </p>
        )}
      </div>

      {/* Post an update */}
      <section
        aria-labelledby="post-update-heading"
        className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-border">
          <h2 id="post-update-heading" className="font-semibold text-[#0f172a]">
            Post an update
          </h2>
        </div>
        <form onSubmit={handlePostUpdate} className="p-5 space-y-4">
          <div>
            <label htmlFor="update-message" className="sr-only">
              Update message
            </label>
            <textarea
              id="update-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={4}
              placeholder={`Post an update as ${region}…`}
              className="w-full px-3 py-2 rounded-lg border border-border bg-white text-sm text-[#0f172a] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#16a34a] focus:border-[#16a34a] transition resize-none"
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[160px]">
              <label
                htmlFor="update-status"
                className="block text-xs font-medium text-muted-foreground mb-1"
              >
                Status change
              </label>
              <select
                id="update-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as IncidentStatus | '')}
                className="w-full h-9 px-3 rounded-lg border border-border bg-white text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#16a34a]"
              >
                {UPDATE_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[160px]">
              <label
                htmlFor="update-author"
                className="block text-xs font-medium text-muted-foreground mb-1"
              >
                Your name
              </label>
              <input
                id="update-author"
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="On-call engineer"
                className="w-full h-9 px-3 rounded-lg border border-border bg-white text-sm text-[#0f172a] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#16a34a] transition"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              Posting from <RegionBadge region={region} size="sm" />
            </p>
            <Button
              type="submit"
              disabled={posting}
              className="bg-[#0f172a] hover:bg-slate-800 text-white"
              size="sm"
            >
              {posting ? 'Posting…' : 'Post update'}
            </Button>
          </div>
        </form>

        {/* OCC / write result banner */}
        {postResult && (
          <div
            className={`mx-5 mb-5 rounded-xl border px-4 py-3 text-sm flex items-start gap-2 ${
              postResult.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : postResult.type === 'conflict'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
            role="status"
          >
            {postResult.type === 'success' ? (
              <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-[#16a34a]" />
            ) : (
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            )}
            <span>
              {postResult.type === 'success' ? (
                postResult.retries > 0 ? (
                  <>
                    <span className="font-semibold">
                      ✓ Committed via {postResult.region}
                    </span>{' '}
                    — DSQL detected a concurrent edit and we auto-retried{' '}
                    <span className="font-mono font-semibold">{postResult.retries}&times;</span>;
                    nothing lost.
                  </>
                ) : (
                  <>
                    <span className="font-semibold">
                      ✓ Committed via {postResult.region}
                    </span>{' '}
                    — strongly consistent.
                  </>
                )
              ) : postResult.type === 'conflict' ? (
                <>
                  <span className="font-semibold">
                    ⚠ Write conflict after max retries
                  </span>{' '}
                  — by design, DSQL rejected rather than lose a write.
                </>
              ) : (
                <>
                  <span className="font-semibold">✗ Error</span> —{' '}
                  {postResult.message}
                </>
              )}
            </span>
          </div>
        )}
      </section>

      {/* Full timeline */}
      <section aria-labelledby="timeline-heading">
        <h2
          id="timeline-heading"
          className="font-semibold text-sm text-[#0f172a] uppercase tracking-wide mb-4"
        >
          Incident Timeline
        </h2>
        <IncidentTimeline updates={incident.updates} />
      </section>
    </div>
  );
}
