import type { IncidentStatus, Severity } from '@/lib/types';

const INCIDENT_STATUS_CONFIG: Record<
  IncidentStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  investigating: {
    label: 'Investigating',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
  },
  identified: {
    label: 'Identified',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  monitoring: {
    label: 'Monitoring',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  resolved: {
    label: 'Resolved',
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
  },
};

const SEVERITY_CONFIG: Record<Severity, { label: string; bg: string; text: string; border: string }> =
  {
    minor: {
      label: 'Minor',
      bg: 'bg-slate-50',
      text: 'text-slate-600',
      border: 'border-slate-200',
    },
    major: {
      label: 'Major',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
    },
    critical: {
      label: 'Critical',
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
    },
  };

export function IncidentStatusBadge({ status }: { status: IncidentStatus }) {
  const cfg = INCIDENT_STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center rounded-md border text-xs font-semibold uppercase tracking-wide px-2 py-0.5 ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      {cfg.label}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const cfg = SEVERITY_CONFIG[severity];
  return (
    <span
      className={`inline-flex items-center rounded-md border text-xs font-medium px-2 py-0.5 ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      {cfg.label}
    </span>
  );
}
