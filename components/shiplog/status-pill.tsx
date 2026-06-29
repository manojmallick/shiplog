import type { ComponentStatus } from '@/lib/types';

const STATUS_CONFIG: Record<
  ComponentStatus,
  { label: string; dotColor: string; bg: string; text: string; border: string }
> = {
  operational: {
    label: 'Operational',
    dotColor: 'bg-[#16a34a]',
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
  },
  degraded: {
    label: 'Degraded',
    dotColor: 'bg-[#d97706]',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  partial_outage: {
    label: 'Partial Outage',
    dotColor: 'bg-[#ea580c]',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
  },
  major_outage: {
    label: 'Major Outage',
    dotColor: 'bg-[#dc2626]',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
  },
  maintenance: {
    label: 'Maintenance',
    dotColor: 'bg-[#2563eb]',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
};

interface StatusPillProps {
  status: ComponentStatus;
  size?: 'sm' | 'md';
}

export function StatusPill({ status, size = 'md' }: StatusPillProps) {
  const cfg = STATUS_CONFIG[status];
  const sizeClasses = size === 'sm' ? 'text-xs px-1.5 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${cfg.bg} ${cfg.text} ${cfg.border} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dotColor}`} aria-hidden="true" />
      {cfg.label}
    </span>
  );
}

export function StatusDot({ status }: { status: ComponentStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full ${cfg.dotColor}`}
      title={cfg.label}
      aria-label={cfg.label}
    />
  );
}
