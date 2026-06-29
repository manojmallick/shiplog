'use client';

import type { RegionId } from '@/lib/types';

const REGION_CONFIG: Record<
  RegionId,
  { flag: string; label: string; code: string; bg: string; text: string; border: string }
> = {
  'us-east-1': {
    flag: '🇺🇸',
    label: 'Virginia',
    code: 'us-east-1',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
  },
  'ap-southeast-1': {
    flag: '🇸🇬',
    label: 'Singapore',
    code: 'ap-southeast-1',
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    border: 'border-violet-200',
  },
};

interface RegionBadgeProps {
  region: RegionId;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export function RegionBadge({ region, size = 'md', showLabel = true }: RegionBadgeProps) {
  const cfg = REGION_CONFIG[region];
  if (!cfg) return null;

  const sizeClasses = size === 'sm' ? 'text-xs px-1.5 py-0.5 gap-1' : 'text-xs px-2 py-1 gap-1.5';

  return (
    <span
      className={`inline-flex items-center rounded-md border font-mono font-medium ${cfg.bg} ${cfg.text} ${cfg.border} ${sizeClasses}`}
      title={`${cfg.flag} ${cfg.code} — ${cfg.label}`}
    >
      <span>{cfg.flag}</span>
      <span>{cfg.code}</span>
      {showLabel && (
        <span className="font-sans font-normal text-[10px] opacity-70">{cfg.label}</span>
      )}
    </span>
  );
}
