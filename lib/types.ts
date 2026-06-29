export type RegionId = 'us-east-1' | 'ap-southeast-1';
export type ComponentStatus =
  | 'operational'
  | 'degraded'
  | 'partial_outage'
  | 'major_outage'
  | 'maintenance';
export type IncidentStatus = 'investigating' | 'identified' | 'monitoring' | 'resolved';
export type Severity = 'minor' | 'major' | 'critical';

export interface Component {
  id: string;
  name: string;
  status: ComponentStatus;
  display_order: number;
  updated_at: string;
}

export interface Incident {
  id: string;
  title: string;
  status: IncidentStatus;
  severity: Severity;
  started_at: string;
  resolved_at: string | null;
  created_region: RegionId | null;
}

export interface IncidentUpdate {
  id: string;
  incident_id: string;
  message: string;
  status: IncidentStatus | null;
  author: string | null;
  author_region: RegionId | null;
  posted_at: string;
}

export interface IncidentWithUpdates extends Incident {
  updates: IncidentUpdate[];
}

export interface UptimeDay {
  date: string; // YYYY-MM-DD
  uptime_pct: number;
}

export interface ComponentUptime {
  component_id: string;
  name: string;
  days: UptimeDay[];
}

export interface StatusPayload {
  components: Component[];
  incidents: IncidentWithUpdates[];
  mock: boolean;
  servedRegion: RegionId;
}

// Every write route returns this so the UI can show the multi-region/OCC story
export interface WriteResult {
  retries: number;
  region: RegionId;
  mock: boolean;
}
