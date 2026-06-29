'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Component, StatusPayload } from '@/lib/types';
import { MOCK_STATUS_PAYLOAD } from '@/lib/mock-data';
import { StatusBanner } from './status-banner';
import { MockBanner } from './mock-banner';
import { ComponentsCard } from './components-card';
import { ActiveIncidents } from './active-incidents';
import { SubscribeForm } from './subscribe-form';

const POLL_INTERVAL = 5000;

export function StatusPageClient() {
  const searchParams = useSearchParams();
  const region = searchParams.get('region') || 'us-east-1';

  const [payload, setPayload] = useState<StatusPayload>({
    ...MOCK_STATUS_PAYLOAD,
    servedRegion: region as 'us-east-1' | 'ap-southeast-1',
  });
  const [flashedIds, setFlashedIds] = useState<Set<string>>(new Set());
  const prevComponentsRef = useRef<Map<string, Component>>(new Map());

  async function fetchStatus() {
    try {
      const res = await fetch(`/api/status?region=${region}`, {
        cache: 'no-store',
      });
      if (!res.ok) return;
      const data: StatusPayload = await res.json();

      // Detect status changes to flash rows
      const flashed = new Set<string>();
      for (const comp of data.components) {
        const prev = prevComponentsRef.current.get(comp.id);
        if (prev && prev.status !== comp.status) {
          flashed.add(comp.id);
        }
      }

      if (flashed.size > 0) {
        setFlashedIds(flashed);
        setTimeout(() => setFlashedIds(new Set()), 1600);
      }

      prevComponentsRef.current = new Map(data.components.map((c) => [c.id, c]));
      setPayload(data);
    } catch {
      // silently ignore fetch errors in demo
    }
  }

  useEffect(() => {
    // Initialize the ref on first render
    prevComponentsRef.current = new Map(payload.components.map((c) => [c.id, c]));
    fetchStatus();

    const interval = setInterval(fetchStatus, POLL_INTERVAL);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region]);

  return (
    <div className="space-y-6">
      {payload.mock && <MockBanner />}

      <StatusBanner
        components={payload.components}
        servedRegion={payload.servedRegion}
        mock={payload.mock}
      />

      <ComponentsCard
        components={payload.components}
        flashedIds={flashedIds}
      />

      <ActiveIncidents incidents={payload.incidents} />

      {/* Get Notified */}
      <section
        className="rounded-2xl border border-border bg-white shadow-sm p-6"
        aria-labelledby="subscribe-heading"
      >
        <h2
          id="subscribe-heading"
          className="font-semibold text-[#0f172a] mb-1"
        >
          Get notified
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Receive an email when a new incident is opened or resolved.
        </p>
        <SubscribeForm />
      </section>
    </div>
  );
}
