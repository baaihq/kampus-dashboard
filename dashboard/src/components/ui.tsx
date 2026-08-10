import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, animate, motion, useInView } from 'framer-motion';
import { Search, SearchX, X } from 'lucide-react';

const EASE = [0.22, 1, 0.36, 1] as const;

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

export function Panel({
  children,
  className = '',
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-line bg-surface shadow-soft dark:bg-slate-800/60 dark:shadow-none ${
        hover ? 'card-hover' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

type ButtonVariant = 'primary' | 'accent' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-50 select-none';

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white shadow-glow hover:bg-secondary hover:-translate-y-0.5 active:translate-y-0 dark:shadow-none',
  accent:
    'bg-gradient-to-r from-primary via-secondary to-accent text-white shadow-glow hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0 dark:shadow-none',
  outline:
    'border border-line bg-white/70 text-ink backdrop-blur hover:border-primary/40 hover:bg-white dark:border-slate-700 dark:bg-slate-800/60 dark:hover:bg-slate-700/70 dark:hover:text-slate-100',
  ghost:
    'text-muted hover:bg-slate-100 hover:text-ink dark:hover:bg-slate-800 dark:hover:text-slate-100',
  danger: 'bg-danger text-white hover:brightness-110 hover:-translate-y-0.5',
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-sm',
};

type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  children: ReactNode;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'>;

export function Button({
  variant = 'primary',
  size = 'md',
  href,
  children,
  className = '',
  ...rest
}: ButtonProps) {
  const cls = `${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`;
  if (href) {
    return (
      <a href={href} className={cls} aria-label={typeof children === 'string' ? children : undefined}>
        {children}
      </a>
    );
  }
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}

type BadgeVariant = 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'neutral' | 'outline';

const BADGE_VARIANTS: Record<BadgeVariant, string> = {
  primary: 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-sky-300',
  accent: 'bg-accent/10 text-cyan-700 dark:bg-accent/20 dark:text-cyan-300',
  success: 'bg-success/10 text-emerald-700 dark:bg-success/20 dark:text-emerald-300',
  warning: 'bg-warning/10 text-amber-700 dark:bg-warning/20 dark:text-amber-300',
  danger: 'bg-danger/10 text-red-700 dark:bg-danger/20 dark:text-red-300',
  neutral: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  outline: 'border border-line text-muted dark:border-slate-700 dark:text-slate-300',
};

export function Badge({
  variant = 'neutral',
  children,
  className = '',
}: {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${BADGE_VARIANTS[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`relative rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
        active
          ? 'bg-primary text-white shadow-glow dark:shadow-none'
          : 'bg-white text-muted border border-line hover:border-primary/40 hover:text-ink dark:bg-slate-800/60 dark:border-slate-700 dark:hover:text-slate-100'
      }`}
    >
      {children}
    </button>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-xl ${className}`} aria-hidden="true" />;
}

export function SkeletonCard() {
  return (
    <Panel className="p-5">
      <Skeleton className="mb-3 h-4 w-24" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="mt-3 h-3 w-full" />
    </Panel>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
        <SearchX className="h-7 w-7" />
      </div>
      <div>
        <p className="font-semibold text-ink dark:text-slate-100">{title}</p>
        {description ? <p className="mt-1 max-w-sm text-sm text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function AnimatedNumber({
  value,
  format,
  className,
}: {
  value: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 1.1,
      ease: EASE,
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [inView, value]);

  const shown = format
    ? format(display)
    : new Intl.NumberFormat('id-ID').format(Math.round(display));

  return (
    <span ref={ref} className={className}>
      {shown}
    </span>
  );
}

export function Sparkline({
  data,
  color = '#2563eb',
  width = 110,
  height = 36,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  const id = useId().replace(/:/g, '');
  if (!data.length || data.every((d) => d === 0)) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1 || 1);
  const pts = data.map((v, i) => [
    i * step,
    height - 3 - ((v - min) / range) * (height - 6),
  ]);
  const line = pts
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ');
  const area = `${line} L${width},${height} L0,${height} Z`;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#spark-${id})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ProgressBar({
  value,
  color = 'bg-primary',
  className = '',
}: {
  value: number;
  color?: string;
  className?: string;
}) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      className={`h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div
        className={`h-full rounded-full ${color}`}
        initial={{ width: 0 }}
        whileInView={{ width: `${clamped}%` }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: EASE }}
      />
    </div>
  );
}

export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 dark:bg-slate-700"
      >
        {label}
      </span>
    </span>
  );
}

export function ChartCard({
  title,
  badge,
  action,
  children,
  className = '',
}: {
  title: ReactNode;
  badge?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Panel className={`p-5 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-semibold">{title}</h3>
        <div className="flex items-center gap-2">
          {badge}
          {action}
        </div>
      </div>
      {children}
    </Panel>
  );
}

export interface ChipOption<T extends string> {
  value: T;
  label: string;
}

export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  allLabel = 'Semua',
  includeAll = true,
  label,
}: {
  options: ChipOption<T>[];
  value: T | '';
  onChange: (value: T | '') => void;
  allLabel?: string;
  includeAll?: boolean;
  label?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={label}>
      {includeAll ? (
        <Chip active={value === ''} onClick={() => onChange('')}>
          {allLabel}
        </Chip>
      ) : null}
      {options.map((option) => (
        <Chip
          key={option.value}
          active={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Chip>
      ))}
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  onCommit,
  placeholder = 'Cari...',
  ariaLabel = 'Cari',
  recent = [],
  onRecentClick,
  onRecentClear,
  className = '',
}: {
  value: string;
  onChange: (value: string) => void;
  onCommit?: () => void;
  placeholder?: string;
  ariaLabel?: string;
  recent?: string[];
  onRecentClick?: (term: string) => void;
  onRecentClear?: () => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onCommit?.();
          }}
          placeholder={placeholder}
          aria-label={ariaLabel}
          className="w-full rounded-full border border-line bg-white py-3 pl-12 pr-11 text-sm shadow-soft transition-shadow focus:border-primary focus:shadow-glow focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100"
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Hapus pencarian"
            className="absolute right-2.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-slate-100 text-muted transition-colors hover:bg-slate-200 hover:text-ink dark:bg-slate-700 dark:hover:text-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {recent.length > 0 ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted">Pencarian terakhir:</span>
          {recent.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => onRecentClick?.(term)}
              className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-muted transition-colors hover:bg-primary/10 hover:text-primary dark:bg-slate-800"
            >
              {term}
            </button>
          ))}
          {onRecentClear ? (
            <button
              type="button"
              onClick={onRecentClear}
              className="text-xs text-muted underline-offset-2 hover:text-danger hover:underline"
            >
              hapus
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label={typeof title === 'string' ? title : undefined}
        >
          <motion.div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            className="relative w-full max-w-lg rounded-3xl border border-line bg-surface shadow-lift dark:bg-slate-900"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4 dark:border-slate-700">
              <h2 className="font-bold">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup dialog"
                className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-slate-100 hover:text-ink dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-5">{children}</div>
            {footer ? (
              <div className="flex justify-end gap-2 border-t border-line px-5 py-4 dark:border-slate-700">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
