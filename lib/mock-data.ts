import type {
  Component,
  ComponentUptime,
  IncidentWithUpdates,
  StatusPayload,
  UptimeDay,
} from './types';

export const MOCK_COMPONENTS: Component[] = [
  {
    id: 'api',
    name: 'API',
    status: 'operational',
    display_order: 1,
    updated_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
  },
  {
    id: 'database',
    name: 'Database',
    status: 'operational',
    display_order: 2,
    updated_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'cdn',
    name: 'CDN',
    status: 'degraded',
    display_order: 3,
    updated_at: new Date(Date.now() - 1000 * 60 * 47).toISOString(),
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    status: 'operational',
    display_order: 4,
    updated_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: 'auth',
    name: 'Auth',
    status: 'operational',
    display_order: 5,
    updated_at: new Date(Date.now() - 1000 * 60 * 200).toISOString(),
  },
];

export const MOCK_INCIDENTS: IncidentWithUpdates[] = [
  {
    id: 'inc-001',
    title: 'Elevated CDN error rates in APAC',
    status: 'monitoring',
    severity: 'major',
    started_at: new Date(Date.now() - 1000 * 60 * 47).toISOString(),
    resolved_at: null,
    created_region: 'ap-southeast-1',
    updates: [
      {
        id: 'upd-003',
        incident_id: 'inc-001',
        message:
          'Error rates have dropped below 0.5%. We are continuing to monitor cache replication across APAC edge nodes. No further customer action needed.',
        status: 'monitoring',
        author: 'Priya Nair',
        author_region: 'ap-southeast-1',
        posted_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      },
      {
        id: 'upd-002',
        incident_id: 'inc-001',
        message:
          'Root cause identified: a misconfigured cache-control header pushed in deploy #4821 is causing stale origin fetches for ~3% of APAC requests. Rollback in progress.',
        status: 'identified',
        author: 'Jordan Kim',
        author_region: 'us-east-1',
        posted_at: new Date(Date.now() - 1000 * 60 * 31).toISOString(),
      },
      {
        id: 'upd-001',
        incident_id: 'inc-001',
        message:
          'We are investigating elevated 5xx error rates on our CDN layer affecting users in the Asia-Pacific region. US traffic is unaffected. Engineers are engaged.',
        status: 'investigating',
        author: 'Priya Nair',
        author_region: 'ap-southeast-1',
        posted_at: new Date(Date.now() - 1000 * 60 * 47).toISOString(),
      },
    ],
  },
  {
    id: 'inc-002',
    title: 'Scheduled database failover',
    status: 'resolved',
    severity: 'minor',
    started_at: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    resolved_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    created_region: 'us-east-1',
    updates: [
      {
        id: 'upd-005',
        incident_id: 'inc-002',
        message:
          'Maintenance complete. Primary database has been promoted to the new replica. All connection pools have re-established. Latency nominal.',
        status: 'resolved',
        author: 'Marcus Chen',
        author_region: 'us-east-1',
        posted_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      },
      {
        id: 'upd-004',
        incident_id: 'inc-002',
        message:
          'Scheduled failover initiated. Expect up to 30 seconds of elevated write latency during primary election.',
        status: 'investigating',
        author: 'Marcus Chen',
        author_region: 'us-east-1',
        posted_at: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
      },
    ],
  },
];

export const MOCK_STATUS_PAYLOAD: StatusPayload = {
  components: MOCK_COMPONENTS,
  incidents: MOCK_INCIDENTS,
  mock: true,
  servedRegion: 'us-east-1',
};

// Generate 90 days of uptime data
function generateUptimeDays(
  seed: number,
  dipDays: { offset: number; pct: number }[]
): UptimeDay[] {
  const days: UptimeDay[] = [];
  const today = new Date();

  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    const dip = dipDays.find((x) => x.offset === i);
    const pct = dip ? dip.pct : 100;

    days.push({ date: dateStr, uptime_pct: pct });
  }

  return days;
}

export const MOCK_COMPONENT_UPTIMES: ComponentUptime[] = [
  {
    component_id: 'api',
    name: 'API',
    days: generateUptimeDays(1, [
      { offset: 45, pct: 99.2 },
      { offset: 12, pct: 99.7 },
    ]),
  },
  {
    component_id: 'database',
    name: 'Database',
    days: generateUptimeDays(2, [
      { offset: 62, pct: 99.4 },
      { offset: 1, pct: 99.2 },
    ]),
  },
  {
    component_id: 'cdn',
    name: 'CDN',
    days: generateUptimeDays(3, [
      { offset: 33, pct: 99.1 },
      { offset: 0, pct: 98.7 },
    ]),
  },
  {
    component_id: 'dashboard',
    name: 'Dashboard',
    days: generateUptimeDays(4, [{ offset: 78, pct: 99.6 }]),
  },
  {
    component_id: 'auth',
    name: 'Auth',
    days: generateUptimeDays(5, [{ offset: 55, pct: 99.3 }]),
  },
];
