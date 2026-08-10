import type { TooltipProps } from 'recharts';
import { fmt, fmtPct } from '../lib/format';

type PayloadItem = {
  name?: string | number;
  value?: number | string | Array<number | string>;
  color?: string;
  fill?: string;
  dataKey?: string | number;
};

export function ChartTooltip({
  active,
  payload,
  label,
  percent = false,
}: TooltipProps<number, string> & { percent?: boolean }) {
  if (!active || !payload || payload.length === 0) return null;

  const formatValue = (value: number | string | Array<number | string> | undefined) => {
    if (typeof value === 'number') return percent ? fmtPct(value, 2) : fmt(value);
    if (Array.isArray(value)) return value.join(' – ');
    return value ?? '-';
  };

  return (
    <div className="rounded-xl border border-line bg-white/95 px-3.5 py-2.5 shadow-lift backdrop-blur dark:border-slate-700 dark:bg-slate-800/70">
      {label ? (
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      ) : null}
      <div className="space-y-1">
        {(payload as PayloadItem[]).map((item, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: item.color ?? item.fill ?? '#2563eb' }}
            />
            <span className="text-muted">{item.name}</span>
            <span className="ml-auto pl-4 font-semibold text-ink dark:text-slate-100">
              {formatValue(item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AreaGradient({ id, from = '#2563eb', to = 'rgba(37,99,235,0.02)' }: { id: string; from?: string; to?: string }) {
  return (
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={from} stopOpacity={0.3} />
        <stop offset="100%" stopColor={to} stopOpacity={0} />
      </linearGradient>
    </defs>
  );
}
