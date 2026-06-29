'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { RegionId } from '@/lib/types';

const REGIONS: { id: RegionId; flag: string; label: string }[] = [
  { id: 'us-east-1', flag: '🇺🇸', label: 'us-east-1' },
  { id: 'ap-southeast-1', flag: '🇸🇬', label: 'ap-southeast-1' },
];

export function RegionSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentRegion = (searchParams.get('region') as RegionId) || 'us-east-1';

  function handleChange(regionId: RegionId) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('region', regionId);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div
      className="flex items-center rounded-lg border border-border bg-slate-50 p-0.5 gap-0.5 shrink-0"
      role="group"
      aria-label="Region selector"
    >
      {REGIONS.map((region) => {
        const isActive = region.id === currentRegion;
        return (
          <button
            key={region.id}
            onClick={() => handleChange(region.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-all ${
              isActive
                ? region.id === 'us-east-1'
                  ? 'bg-sky-100 text-sky-700 shadow-sm border border-sky-200'
                  : 'bg-violet-100 text-violet-700 shadow-sm border border-violet-200'
                : 'text-slate-500 hover:text-slate-700 border border-transparent'
            }`}
            aria-pressed={isActive}
            title={`Switch to ${region.label}`}
          >
            <span>{region.flag}</span>
            <span className="hidden sm:inline">{region.label}</span>
            <span className="sm:hidden">{region.id === 'us-east-1' ? 'US' : 'SG'}</span>
          </button>
        );
      })}
    </div>
  );
}
