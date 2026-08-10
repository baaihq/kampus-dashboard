import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Award,
  ChevronRight,
  ExternalLink,
  Home,
  Link2,
  Share2,
  Star,
} from 'lucide-react';
import { useKampus } from '../context/kampusContext';
import { prodiKey } from '../lib/keys';
import { useFavorites } from '../lib/hooks';
import { fmt, fmtPct, rasio, toTrend, type TrendPoint } from '../lib/format';
import { ChartCard, Badge, Button, Panel, ProgressBar, Reveal, Tooltip } from '../components/ui';
import { ChartTooltip } from '../components/charts';
import type { Seleksi } from '../types';

export default function Detail() {
  const { ptnId = '', prodiId = '' } = useParams();
  const { data } = useKampus();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [seleksi, setSeleksi] = useState<Seleksi>('snbt');
  const [copied, setCopied] = useState(false);

  const favKey = prodiKey(ptnId, prodiId);

  const ctx = useMemo(() => {
    if (!data) return null;
    const key = prodiKey(ptnId, prodiId);
    const snbp = data.snbp.get(key);
    const snbt = data.snbt.get(key);
    const dSnbp = data.detailSnbp.get(key);
    const dSnbt = data.detailSnbt.get(key);
    const ptn = data.ptnById.get(ptnId);
    if (!snbp && !snbt) return null;
    return { snbp, snbt, dSnbp, dSnbt, ptn, key };
  }, [data, ptnId, prodiId]);

  const trend = useMemo<TrendPoint[]>(() => {
    if (!ctx) return [];
    return toTrend(seleksi === 'snbp' ? ctx.dSnbp : ctx.dSnbt);
  }, [ctx, seleksi]);

  const provRows = useMemo(() => {
    const perProv = ctx?.dSnbt?.peminat_per_prov ?? {};
    const rows = Object.entries(perProv).map(([prov, values]) => ({
      prov,
      values,
      total: Object.values(values).reduce<number>((acc, v) => acc + (v ?? 0), 0),
    }));
    return rows.sort((a, b) => b.total - a.total);
  }, [ctx?.dSnbt]);

  const provChart = provRows.slice(0, 15).map((r) => ({ name: r.prov, peminat: r.values['2025'] ?? 0 }));

  if (!data) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-28 rounded-2xl" />
        ))}
      </div>
    );
  }
  if (!ctx) {
    return (
      <Panel className="p-10 text-center">
        <p className="text-muted">Jurusan tidak ditemukan.</p>
        <Link to="/jurusan" className="mt-3 inline-block font-medium text-primary hover:underline">
          Kembali ke daftar jurusan
        </Link>
      </Panel>
    );
  }

  const active = seleksi === 'snbp' ? ctx.snbp : ctx.snbt;
  const r = rasio(active?.daya_tampung, active?.peminat);
  const fav = isFavorite(favKey);
  const ptn = ctx.ptn;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: active?.nama ?? 'Jurusan', url: window.location.href });
      } catch {
        /* ignore */
      }
    } else {
      copyLink();
    }
  };

  const quickInfo = [
    {
      label: 'Acceptance Rate 2025',
      value: fmtPct(r, 2),
      progress: r !== null ? Math.min(100, r * 10) : 0,
      color: 'bg-gradient-to-r from-success to-accent',
      note: 'rasio daya tampung / peminat',
    },
    {
      label: 'Daya Tampung 2026',
      value: fmt(active?.daya_tampung),
      progress: 0,
      color: 'bg-gradient-to-r from-primary to-secondary',
      note: 'kuota SNBP/SNBT tahun masuk',
    },
    {
      label: 'Jumlah Peminat 2025',
      value: fmt(active?.peminat),
      progress: 0,
      color: 'bg-gradient-to-r from-warning to-danger',
      note: 'peminat tahun 2025',
    },
    {
      label: 'Rasio Keketatan',
      value: fmtPct(r, 2),
      progress: 0,
      color: 'bg-gradient-to-r from-danger to-warning',
      note: 'semakin kecil semakin ketat',
    },
  ];

  return (
    <div className="space-y-6">
      <Reveal>
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted">
          <Link to="/" className="inline-flex items-center gap-1 transition-colors hover:text-primary">
            <Home className="h-3.5 w-3.5" /> Ringkasan
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to="/jurusan" className="transition-colors hover:text-primary">Jurusan</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="truncate font-medium text-ink dark:text-slate-100">{active?.nama}</span>
        </nav>
      </Reveal>

      <Reveal delay={0.05}>
        <section className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-primary/10 via-white to-accent/10 p-6 shadow-soft dark:from-primary/10 dark:via-slate-800/30 dark:to-accent/10 sm:p-8">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
          <div className="absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-accent/10 blur-3xl" aria-hidden="true" />

          <div className="relative">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="primary">{seleksi === 'snbp' ? 'SNBP' : 'SNBT'}</Badge>
                  <Badge variant="neutral">{active?.jenjang}</Badge>
                  {active?.portofolio && active.portofolio !== 'Tidak Ada' ? (
                    <Badge variant="warning">
                      <Award className="h-3 w-3" /> Portofolio: {active.portofolio}
                    </Badge>
                  ) : null}
                  <span className="font-mono text-xs text-muted">kode {active?.kode}</span>
                </div>
                <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                  {active?.nama ?? '—'}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                  <Link
                    to={`/jurusan?ptn=${ptnId}`}
                    className="font-medium text-ink transition-colors hover:text-primary dark:text-slate-100"
                  >
                    {ptn?.nama}
                  </Link>
                  <span>·</span>
                  <span>
                    {ptn?.kab_kota}, {ptn?.provinsi_1}
                  </span>
                  {ptn?.website ? (
                    <a
                      href={ptn.website}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> {ptn.website}
                    </a>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Tooltip label={copied ? 'Tersalin!' : 'Salin tautan'}>
                  <button
                    onClick={copyLink}
                    aria-label="Salin tautan"
                    className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-white/70 text-muted transition-all hover:-translate-y-0.5 hover:text-primary dark:border-slate-700 dark:bg-slate-800/60"
                  >
                    <Link2 className="h-4 w-4" />
                  </button>
                </Tooltip>
                <Tooltip label="Bagikan">
                  <button
                    onClick={share}
                    aria-label="Bagikan"
                    className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-white/70 text-muted transition-all hover:-translate-y-0.5 hover:text-primary dark:border-slate-700 dark:bg-slate-800/60"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                </Tooltip>
                <Tooltip label={fav ? 'Hapus dari favorit' : 'Tambah ke favorit'}>
                  <button
                    onClick={() => toggleFavorite(favKey)}
                    aria-label="Favorit"
                    aria-pressed={fav}
                    className={`grid h-10 w-10 place-items-center rounded-xl border transition-all hover:-translate-y-0.5 ${
                      fav
                        ? 'border-warning/40 bg-warning/10 text-warning'
                        : 'border-line bg-white/70 text-muted hover:text-warning dark:border-slate-700 dark:bg-slate-800/60'
                    }`}
                  >
                    <Star className="h-4 w-4" fill={fav ? 'currentColor' : 'none'} />
                  </button>
                </Tooltip>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <button
                onClick={() => setSeleksi('snbp')}
                aria-pressed={seleksi === 'snbp'}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                  seleksi === 'snbp'
                    ? 'bg-primary text-white shadow-glow dark:shadow-none'
                    : 'border border-line bg-white/70 text-muted hover:text-ink dark:border-slate-700 dark:bg-slate-800/60 dark:hover:text-slate-100'
                }`}
              >
                SNBP
              </button>
              <button
                onClick={() => setSeleksi('snbt')}
                aria-pressed={seleksi === 'snbt'}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                  seleksi === 'snbt'
                    ? 'bg-emerald-600 text-white shadow-glow dark:shadow-none'
                    : 'border border-line bg-white/70 text-muted hover:text-ink dark:border-slate-700 dark:bg-slate-800/60 dark:hover:text-slate-100'
                }`}
              >
                SNBT
              </button>
            </div>
          </div>
        </section>
      </Reveal>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickInfo.map((info, i) => (
          <Reveal key={info.label} delay={i * 0.04}>
            <Panel hover className="p-5">
              <p className="text-sm text-muted">{info.label}</p>
              <p className="mt-1 text-2xl font-extrabold tracking-tight">{info.value}</p>
              {info.progress > 0 ? (
                <ProgressBar value={info.progress} color={info.color} className="mt-3" />
              ) : (
                <div className="mt-3 h-2 rounded-full bg-slate-100 dark:bg-slate-800" />
              )}
              <p className="mt-2 text-xs text-muted">{info.note}</p>
            </Panel>
          </Reveal>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Reveal>
          <ChartCard title="Tren Peminat &amp; Daya Tampung" badge={<Badge variant="outline">{seleksi.toUpperCase()}</Badge>}>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(148 163 184 / 0.2)" vertical={false} />
                <XAxis dataKey="tahun" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis yAxisId="pm" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} width={60} />
                <YAxis yAxisId="dt" orientation="right" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} width={40} />
                <RechartsTooltip content={<ChartTooltip />} />
                <Legend />
                <defs>
                  <linearGradient id="g-dt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="#94a3b8" stopOpacity={0.15} />
                  </linearGradient>
                </defs>
                <Bar yAxisId="dt" dataKey="daya_tampung" name="Daya Tampung" fill="url(#g-dt)" radius={[6, 6, 0, 0]} animationDuration={800} />
                <Line
                  yAxisId="pm"
                  dataKey="peminat"
                  name="Peminat"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#2563eb' }}
                  activeDot={{ r: 5 }}
                  animationDuration={900}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>
        </Reveal>

        <Reveal delay={0.05}>
          <ChartCard title="Rasio Keketatan" badge={<Badge variant="outline">{seleksi.toUpperCase()}</Badge>}>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(148 163 184 / 0.2)" vertical={false} />
                <XAxis dataKey="tahun" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis unit="%" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} width={48} />
                <RechartsTooltip content={<ChartTooltip percent />} />
                <defs>
                  <linearGradient id="g-rasio" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <Area dataKey="persentase" name="Rasio" stroke="#ef4444" strokeWidth={2.5} fill="url(#g-rasio)" animationDuration={900} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>
        </Reveal>
      </div>

      <Reveal>
        <Panel className="overflow-hidden p-0">
          <div className="border-b border-line p-5 dark:border-slate-700">
            <h2 className="font-semibold">Detail Multi-Tahun ({seleksi.toUpperCase()})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted dark:bg-slate-800/60">
                <tr>
                  <th className="px-5 py-3 text-left">Tahun</th>
                  <th className="px-5 py-3 text-right">Peminat</th>
                  <th className="px-5 py-3 text-right">Daya Tampung</th>
                  <th className="px-5 py-3 text-right">Rasio</th>
                </tr>
              </thead>
              <tbody>
                {trend.map((t) => (
                  <tr key={t.tahun} className="border-t border-line transition-colors hover:bg-primary/5 dark:border-slate-800">
                    <td className="px-5 py-3 font-medium">{t.tahun}</td>
                    <td className="px-5 py-3 text-right font-mono">{fmt(t.peminat)}</td>
                    <td className="px-5 py-3 text-right font-mono">{fmt(t.daya_tampung)}</td>
                    <td className="px-5 py-3 text-right font-mono">{fmtPct(t.persentase, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </Reveal>

      {seleksi === 'snbt' && ctx.dSnbt ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Reveal>
            <ChartCard title="Peminat per Provinsi (SNBT)">
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={provChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(148 163 184 / 0.2)" vertical={false} />
                  <XAxis dataKey="name" angle={-38} textAnchor="end" height={90} interval={0} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} width={48} />
                  <RechartsTooltip content={<ChartTooltip />} />
                  <defs>
                    <linearGradient id="g-prov" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0d9488" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.5} />
                    </linearGradient>
                  </defs>
                  <Bar dataKey="peminat" name="Peminat 2025" fill="url(#g-prov)" radius={[6, 6, 0, 0]} animationDuration={900} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>
          </Reveal>

          <Reveal delay={0.05}>
            <Panel className="overflow-hidden p-0">
              <div className="border-b border-line p-5 dark:border-slate-700">
                <h2 className="font-semibold">Detail Peminat per Provinsi</h2>
              </div>
              <div className="max-h-96 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-muted dark:bg-slate-800/70">
                    <tr>
                      <th className="px-4 py-2 text-left">Provinsi</th>
                      {['2021', '2022', '2023', '2024', '2025'].map((y) => (
                        <th key={y} className="px-4 py-2 text-right">{y}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {provRows.map((p) => (
                      <tr key={p.prov} className="border-t border-line transition-colors hover:bg-primary/5 dark:border-slate-800">
                        <td className="px-4 py-2 font-medium">{p.prov}</td>
                        {['2021', '2022', '2023', '2024', '2025'].map((y) => (
                          <td key={y} className="px-4 py-2 text-right font-mono">{fmt(p.values[y])}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </Reveal>
        </div>
      ) : null}

      <Reveal>
        <div className="flex flex-wrap justify-between gap-3">
          <Button variant="outline" href="/jurusan">
            Kembali ke daftar
          </Button>
          <div className="flex gap-2">
            <Button variant="primary" onClick={share}>
              <Share2 className="h-4 w-4" /> Bagikan
            </Button>
            <Button variant="accent" href={`/jurusan?ptn=${ptnId}`}>
              Lihat jurusan lain di {ptn?.nama.split(' ').slice(0, 2).join(' ')}
            </Button>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
