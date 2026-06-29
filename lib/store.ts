/**
 * Shared in-memory store for the demo (no Aurora DSQL configured).
 * This simulates the multi-region write behavior with mock OCC retries.
 */
import { MOCK_INCIDENTS, MOCK_COMPONENTS } from './mock-data';
import type {
  Component,
  ComponentStatus,
  IncidentStatus,
  IncidentWithUpdates,
  RegionId,
  WriteResult,
} from './types';

// Module-level singletons (persist across requests in the same Node.js process)
let _incidents: IncidentWithUpdates[] = [...MOCK_INCIDENTS];
let _components: Component[] = [...MOCK_COMPONENTS];

export function getIncidents(): IncidentWithUpdates[] {
  return _incidents;
}

export function getIncidentById(id: string): IncidentWithUpdates | undefined {
  return _incidents.find((i) => i.id === id);
}

export function getComponents(): Component[] {
  return _components;
}

export function createIncident(
  title: string,
  message: string,
  severity: 'minor' | 'major' | 'critical',
  author: string,
  region: RegionId
): { incident: IncidentWithUpdates; result: WriteResult } {
  const id = `inc-${Date.now()}`;
  const now = new Date().toISOString();

  const newIncident: IncidentWithUpdates = {
    id,
    title,
    status: 'investigating',
    severity,
    started_at: now,
    resolved_at: null,
    created_region: region,
    updates: [
      {
        id: `upd-${Date.now()}`,
        incident_id: id,
        message,
        status: 'investigating',
        author: author || 'On-call engineer',
        author_region: region,
        posted_at: now,
      },
    ],
  };

  _incidents = [newIncident, ..._incidents];

  const result: WriteResult = {
    retries: 0,
    region,
    mock: true,
  };

  return { incident: newIncident, result };
}

export function postUpdate(
  incidentId: string,
  message: string,
  status: IncidentStatus | null,
  author: string,
  region: RegionId
): { incident: IncidentWithUpdates; result: WriteResult } | null {
  const incident = _incidents.find((i) => i.id === incidentId);
  if (!incident) return null;

  // Simulate random OCC retries (0-2) to demo DSQL behavior
  const retries = Math.random() < 0.3 ? Math.floor(Math.random() * 2) + 1 : 0;

  const newUpdate = {
    id: `upd-${Date.now()}`,
    incident_id: incidentId,
    message,
    status,
    author: author || 'On-call engineer',
    author_region: region,
    posted_at: new Date().toISOString(),
  };

  const updatedIncident: IncidentWithUpdates = {
    ...incident,
    status: status || incident.status,
    resolved_at:
      status === 'resolved' ? new Date().toISOString() : incident.resolved_at,
    updates: [newUpdate, ...incident.updates],
  };

  _incidents = _incidents.map((i) =>
    i.id === incidentId ? updatedIncident : i
  );

  const result: WriteResult = {
    retries,
    region,
    mock: true,
  };

  return { incident: updatedIncident, result };
}

export function updateComponentStatus(
  componentId: string,
  status: ComponentStatus,
  region: RegionId
): { component: Component; result: WriteResult } | null {
  const component = _components.find((c) => c.id === componentId);
  if (!component) return null;

  const retries = Math.random() < 0.2 ? 1 : 0;

  const updated: Component = {
    ...component,
    status,
    updated_at: new Date().toISOString(),
  };

  _components = _components.map((c) => (c.id === componentId ? updated : c));

  const result: WriteResult = {
    retries,
    region,
    mock: true,
  };

  return { component: updated, result };
}
