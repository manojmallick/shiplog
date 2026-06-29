import type { ComponentUptime } from '@/lib/types';

function uptimeColor(pct: number): string {
  if (pct >= 99.9) return 'bg-[#16a34a]';
  if (pct >= 99.0) return 'bg-[#d97706]';
  if (pct >= 95.0) return 'bg-[#ea580c]';
  return 'bg-[#dc2626]';
}

interface UptimeBarProps {
  data: ComponentUptime;
}

export function UptimeBar({ data }: UptimeBarProps) {
  const avg =
    data.days.reduce((sum, d) => sum + d.uptime_pct, 0) / data.days.length;

  return (
    <div className="rounded-2xl border border-border bg-white shadow-sm p-5">
      <div className="flex items-center justify-between mb-3 gap-4">
        <span className="text-sm font-semibold text-[#0f172a]">{data.name}</span>
        <span className="text-xs font-mono text-muted-foreground tabular-nums">
          {avg.toFixed(2)}% uptime
        </span>
      </div>

      {/* Bar */}
      <div
        className="flex gap-px items-end h-8"
        role="img"
        aria-label={`90-day uptime for ${data.name}: ${avg.toFixed(2)}% average`}
      >
        {data.days.map((day) => (
          <div
            key={day.date}
            title={`${day.date}: ${day.uptime_pct.toFixed(2)}%`}
            className={`flex-1 rounded-sm transition-opacity hover:opacity-70 ${uptimeColor(
              day.uptime_pct
            )}`}
            style={{ height: `${Math.max(20, day.uptime_pct * 0.32)}px` }}
          />
        ))}
      </div>

      {/* Axis labels */}
      <div className="flex justify-between mt-2">
        <span className="text-[10px] text-muted-foreground">90 days ago</span>
        <span className="text-[10px] text-muted-foreground">Today</span>
      </div>
    </div>
  );
}
