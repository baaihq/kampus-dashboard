import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowRight,
  Building2,
  Flame,
  GraduationCap,
  LayoutDashboard,
  Medal,
  Star,
  TrendingUp,
  Users,
  Boxes,
  Percent,
  BarChart3,
} from 'lucide-react';
import { useKampus } from '../context/kampusContext';
import { prodiKey } from '../lib/keys';
import { useFavorites } from '../lib/hooks';
import { fmt, fmtPct, rasio, YEARS } from '../lib/format';
import { ChartCard, AnimatedNumber, Badge, Button, Panel, Reveal, SkeletonCard, Sparkline } from '../components/ui';
import { ChartTooltip } from '../components/charts';
import type { ProdiLike } from '../lib/types-ui';
import type { ProdiRow } from '../types';

const PIE_COLORS = ['#2563eb', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface RankingItem {
  name: string;
  value: number | string;
  sub?: string;
  link?: string;
}

function MedalBadge({ rank }: { rank: number }) {
  const medal =
    rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : <span className="font-mono text-xs text-muted">{rank}</span>;
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-50 text-lg dark:bg-slate-800">
      {medal}
    </span>
  );
}

function RankingCard({ title, items }: { title: string; items: RankingItem[] }) {
  return (
    <Panel hover className="p-5">
      <div className="mb-4 flex items-center gap-2">
        <Medal className="h-4 w-4 text-warning" />
        <h3 className="font-semibold">{title}</h3>
      </div>
      <ol className="space-y-3">
        {items.map((item, i) => (
          <li key={item.name + i} className="flex items-center gap-3">
            <MedalBadge rank={i + 1} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {item.link ? (
                  <Link to={item.link} className="hover:text-primary">
                    {item.name}
                  </Link>
                ) : (
                  item.name
                )}
              </p>
              {item.sub ? <p className="truncate text-xs text-muted">{item.sub}</p> : null}
            </div>
            <span className="font-mono text-sm font-semibold">{item.value}</span>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

export default function Home() {
  const { data } = useKampus();
  const { favorites, isFavorite } = useFavorites();

  const stats = useMemo(() => {
    if (!data) return null;

    const snbpRows = Array.from(data.snbp.values());
    const snbtRows = Array.from(data.snbt.values());

    const sum = (rows: Iterable<ProdiRow>, field: 'daya_tampung' | 'peminat') =>
      Array.from(rows).reduce((acc, r) => acc + (r[field] ?? 0), 0);

    const byKategori = (rows: Iterable<ProdiRow>) => {
      const counts = new Map<string, number>();
      for (const r of rows) {
        const k = data.ptnById.get(r.ptn_id)?.kategori ?? 'akademik';
        counts.set(k, (counts.get(k) ?? 0) + 1);
      }
      return counts;
    };

    const unique = new Set<string>();
    for (const r of data.snbp.values()) unique.add(prodiKey(r.ptn_id, r.prodi_id));
    for (const r of data.snbt.values()) unique.add(prodiKey(r.ptn_id, r.prodi_id));

    const buildNational = (detailMap: Map<string, ProdiLike>) => {
      const pm = Object.fromEntries(YEARS.map((y) => [y, 0])) as Record<string, number>;
      const dt = Object.fromEntries(YEARS.map((y) => [y, 0])) as Record<string, number>;
      for (const rec of detailMap.values()) {
        for (const y of YEARS) {
          const s = rec.sebaran?.[y];
          if (s?.peminat) pm[y] += s.peminat;
          if (s?.daya_tampung) dt[y] += s.daya_tampung;
        }
      }
      return YEARS.map((y) => ({ tahun: y, peminat: pm[y], daya_tampung: dt[y] }));
    };

    const natSnbp = buildNational(data.detailSnbp);
    const natSnbt = buildNational(data.detailSnbt);

    const pctChange = (arr: { tahun: string; peminat: number; daya_tampung: number }[], key: 'peminat' | 'daya_tampung') => {
      const a = arr.find((d) => d.tahun === '2024')?.[key] ?? 0;
      const b = arr.find((d) => d.tahun === '2025')?.[key] ?? 0;
      if (!a) return null;
      return ((b - a) / a) * 100;
    };

    const rasioTrend = natSnbt.map((d) => ({
      tahun: d.tahun,
      value: d.peminat > 0 ? (d.daya_tampung / d.peminat) * 100 : null,
    }));

    const rasioPctChange = (() => {
      const a = rasioTrend.find((d) => d.tahun === '2024')?.value;
      const b = rasioTrend.find((d) => d.tahun === '2025')?.value;
      if (a === null || a === undefined || a === 0 || b === null || b === undefined) return null;
      return ((b - a) / a) * 100;
    })();

    const topKetat = snbtRows
      .filter((r) => r.peminat !== null && r.peminat > 0 && r.daya_tampung !== null)
      .map((r) => ({ row: r, value: rasio(r.daya_tampung, r.peminat) as number }))
      .sort((a, b) => a.value - b.value)
      .slice(0, 10);

    const topPeminat = snbtRows
      .filter((r) => r.peminat !== null)
      .map((r) => ({ row: r, value: r.peminat as number }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const topDt = snbtRows
      .filter((r) => r.daya_tampung !== null)
      .map((r) => ({ row: r, value: r.daya_tampung as number }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const topPassing = Array.from(data.detailSnbt.values())
      .map((d) => ({
        row: data.snbt.get(prodiKey(d.ptn_id, d.prodi_id)),
        value: d.sebaran?.['2025']?.persentase ?? null,
      }))
      .filter((x): x is { row: ProdiRow; value: number } => !!x.row && x.value !== null)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const jenjangMap = new Map<string, number>();
    for (const r of snbpRows) jenjangMap.set(r.jenjang, (jenjangMap.get(r.jenjang) ?? 0) + 1);
    const jenjang = Array.from(jenjangMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const ptnMap = new Map<string, number>();
    for (const r of snbpRows) {
      const name = data.ptnById.get(r.ptn_id)?.nama ?? r.ptn_id;
      ptnMap.set(name, (ptnMap.get(name) ?? 0) + 1);
    }
    const topPtn = Array.from(ptnMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const ptnAgg = new Map<string, { dt: number; pm: number }>();
    for (const r of data.snbt.values()) {
      const acc = ptnAgg.get(r.ptn_id) ?? { dt: 0, pm: 0 };
      acc.dt += r.daya_tampung ?? 0;
      acc.pm += r.peminat ?? 0;
      ptnAgg.set(r.ptn_id, acc);
    }
    const ptnKetat = Array.from(ptnAgg.entries())
      .filter(([, v]) => v.pm > 0)
      .map(([ptnId, v]) => ({ ptnId, value: (v.dt / v.pm) * 100 }))
      .sort((a, b) => a.value - b.value)
      .slice(0, 5);

    const kategoriCounts = byKategori(snbpRows);

    return {
      totalPtn: data.ptnList.length,
      totalProdi: unique.size,
      dtSnbp: sum(snbpRows, 'daya_tampung'),
      pmSnbp: sum(snbpRows, 'peminat'),
      natSnbp,
      natSnbt,
      rasioTrend,
      peminatChange: pctChange(natSnbp, 'peminat'),
      dtChange: pctChange(natSnbp, 'daya_tampung'),
      rasioChange: rasioPctChange,
      kategoriCounts,
      topKetat,
      topPeminat,
      topDt,
      topPassing,
      jenjang,
      topPtn,
      ptnKetat,
    };
  }, [data]);

  if (!data || !stats) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  const favItems = favorites
    .map((key) => {
      const row = data.snbp.get(key) ?? data.snbt.get(key);
      if (!row) return null;
      const [ptnId, prodiId] = key.split(':');
      return { key, row, ptnId, prodiId };
    })
    .filter((x): x is { key: string; row: ProdiRow; ptnId: string; prodiId: string } => !!x);

  const quickActions = [
    { to: '/ptn', label: 'Semua PTN', icon: Building2 },
    { to: '/jurusan', label: 'Semua Jurusan', icon: GraduationCap },
    { to: '#statistik', label: 'Statistik Nasional', icon: BarChart3 },
    { to: '#ranking', label: 'Jurusan Terketat', icon: Flame },
    { to: '#favorit', label: 'Favorit', icon: Star },
  ];

  const rankings = [
    {
      title: 'Top PTN Terketat',
      items: stats.ptnKetat.map((p) => ({
        name: data.ptnById.get(p.ptnId)?.nama ?? p.ptnId,
        value: `${fmtPct(p.value, 1)}`,
        sub: 'rasio daya tampung / peminat',
        link: `/ptn`,
      })),
    },
    {
      title: 'Top Jurusan Favorit',
      items: stats.topPeminat.slice(0, 5).map((p) => ({
        name: p.row.nama,
        value: fmt(p.value),
        sub: data.ptnById.get(p.row.ptn_id)?.nama ?? '',
        link: `/jurusan/${p.row.ptn_id}/${p.row.prodi_id}`,
      })),
    },
    {
      title: 'Top Daya Tampung',
      items: stats.topDt.map((p) => ({
        name: p.row.nama,
        value: fmt(p.value),
        sub: data.ptnById.get(p.row.ptn_id)?.nama ?? '',
        link: `/jurusan/${p.row.ptn_id}/${p.row.prodi_id}`,
      })),
    },
    {
      title: 'Top Passing Grade 2025',
      items: stats.topPassing.map((p) => ({
        name: p.row.nama,
        value: `${fmtPct(p.value, 1)}`,
        sub: data.ptnById.get(p.row.ptn_id)?.nama ?? '',
        link: `/jurusan/${p.row.ptn_id}/${p.row.prodi_id}`,
      })),
    },
  ];

  const kpis = [
    {
      label: 'Perguruan Tinggi Negeri',
      value: stats.totalPtn,
      icon: <Building2 className="h-5 w-5" />,
      accent: 'from-primary to-secondary',
      spark: [stats.kategoriCounts.get('akademik') ?? 0, stats.kategoriCounts.get('vokasi') ?? 0, stats.kategoriCounts.get('ptkin') ?? 0],
      sub: 'akademik · vokasi · PTKIN',
    },
    {
      label: 'Total Jurusan',
      value: stats.totalProdi,
      icon: <Boxes className="h-5 w-5" />,
      accent: 'from-accent to-success',
      spark: [stats.kategoriCounts.get('akademik') ?? 0, stats.kategoriCounts.get('vokasi') ?? 0, stats.kategoriCounts.get('ptkin') ?? 0],
      sub: 'unik SNBP & SNBT',
    },
    {
      label: 'Peminat Nasional 2025',
      value: stats.pmSnbp,
      icon: <Users className="h-5 w-5" />,
      accent: 'from-secondary to-accent',
      spark: stats.natSnbp.map((d) => d.peminat),
      delta: stats.peminatChange,
      sub: 'SNBP · total peminat',
    },
    {
      label: 'Daya Tampung Nasional',
      value: stats.dtSnbp,
      icon: <TrendingUp className="h-5 w-5" />,
      accent: 'from-warning to-danger',
      spark: stats.natSnbp.map((d) => d.daya_tampung),
      delta: stats.dtChange,
      sub: 'SNBP · total 2026',
    },
    {
      label: 'Rasio Keketatan Nasional',
      value: null,
      icon: <Percent className="h-5 w-5" />,
      accent: 'from-danger to-warning',
      spark: stats.rasioTrend.map((d) => d.value ?? 0),
      delta: stats.rasioChange,
      sub: 'SNBT · daya tampung / peminat',
    },
  ];

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-primary/5 via-white/60 to-accent/5 p-6 shadow-soft dark:from-primary/10 dark:via-slate-800/30 dark:to-accent/10 sm:p-10">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-primary/10 blur-2xl" aria-hidden="true" />
        <div className="absolute -bottom-14 left-1/4 h-44 w-44 rounded-full bg-accent/10 blur-2xl" aria-hidden="true" />

        <div className="relative grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <Reveal>
              <Badge variant="primary" className="mb-4">
                <LayoutDashboard className="h-3.5 w-3.5" /> Data 2021–2025 · 146 PTN
              </Badge>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
                Dashboard <span className="text-gradient">SNBP &amp; SNBT</span> Indonesia
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-4 max-w-xl text-base text-muted sm:text-lg">
                Analisis lengkap daya tampung, peminat, rasio keketatan, statistik, serta eksplorasi
                seluruh Perguruan Tinggi Negeri di Indonesia.
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button href="/jurusan" size="lg">
                  Mulai Eksplorasi <ArrowRight className="h-4 w-4" />
                </Button>
                <Button href="#statistik" variant="outline" size="lg">
                  <BarChart3 className="h-4 w-4" /> Lihat Statistik
                </Button>
              </div>
            </Reveal>
          </div>

          <div className="relative hidden h-56 lg:block" aria-hidden="true">
            <div className="animate-float absolute left-4 top-2 flex items-center gap-3 rounded-2xl border border-line bg-white/80 p-3 shadow-lift backdrop-blur dark:bg-slate-800/70">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </span>
              <div>
                <p className="text-lg font-bold">{fmt(stats.pmSnbp)}</p>
                <p className="text-xs text-muted">Peminat SNBP 2025</p>
              </div>
            </div>
            <div className="animate-float-slow absolute right-2 top-16 flex items-center gap-3 rounded-2xl border border-line bg-white/80 p-3 shadow-lift backdrop-blur dark:bg-slate-800/70">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/10 text-accent">
                <TrendingUp className="h-5 w-5" />
              </span>
              <div>
                <p className="text-lg font-bold">{fmt(stats.totalProdi)}</p>
                <p className="text-xs text-muted">Jurusan aktif</p>
              </div>
            </div>
            <div className="animate-float absolute bottom-2 left-1/3 flex items-center gap-3 rounded-2xl border border-line bg-white/80 p-3 shadow-lift backdrop-blur [animation-delay:1.5s] dark:bg-slate-800/70">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-success/10 text-success">
                <GraduationCap className="h-5 w-5" />
              </span>
              <div>
                <p className="text-lg font-bold">{fmt(stats.totalPtn)}</p>
                <p className="text-xs text-muted">PTN seluruh Indonesia</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5" aria-label="Statistik utama">
        {kpis.map((kpi, i) => (
          <Reveal key={kpi.label} delay={i * 0.04}>
            <Panel hover className="group relative overflow-hidden p-5">
              <div
                className={`pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${kpi.accent}`}
                aria-hidden="true"
              />
              <div className="flex items-start justify-between">
                <span
                  className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${kpi.accent} text-white shadow-soft`}
                >
                  {kpi.icon}
                </span>
                {kpi.delta !== null && kpi.delta !== undefined ? (
                  <Badge variant={kpi.delta >= 0 ? 'danger' : 'success'}>
                    <TrendingUp
                      className={`h-3 w-3 ${kpi.delta < 0 ? 'rotate-180' : ''}`}
                    />
                    {Math.abs(kpi.delta).toFixed(1)}%
                  </Badge>
                ) : null}
              </div>
              <p className="mt-4 text-2xl font-extrabold tracking-tight">
                {kpi.value === null ? (
                  <AnimatedNumber
                    value={stats.rasioTrend.find((d) => d.tahun === '2025')?.value ?? 0}
                    format={(n) => `${n.toFixed(2)}%`}
                  />
                ) : (
                  <AnimatedNumber value={kpi.value} />
                )}
              </p>
              <p className="mt-1 text-sm font-medium text-ink dark:text-slate-200">{kpi.label}</p>
              <p className="text-xs text-muted">{kpi.sub}</p>
              <div className="mt-3 opacity-80 transition-opacity group-hover:opacity-100">
                <Sparkline data={kpi.spark} color={i === 3 ? '#f59e0b' : i === 4 ? '#ef4444' : '#2563eb'} />
              </div>
            </Panel>
          </Reveal>
        ))}
      </section>

      <section aria-label="Aksi cepat">
        <div className="flex flex-wrap gap-3">
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <Reveal key={action.label} delay={i * 0.03}>
                <a
                  href={action.to}
                  className="glass inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium text-ink shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift dark:text-slate-100 dark:shadow-none"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  {action.label}
                </a>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section aria-label="Jurusan terpopuler">
        <Reveal>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <Flame className="h-5 w-5 text-danger" /> Jurusan Terpopuler
            </h2>
            <Link to="/jurusan" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Lihat semua <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
        <div className="scrollbar-thin flex snap-x gap-4 overflow-x-auto pb-4">
          {stats.topPeminat.map(({ row, value }, i) => (
            <Reveal key={prodiKey(row.ptn_id, row.prodi_id)} delay={i * 0.03}>
              <Link
                to={`/jurusan/${row.ptn_id}/${row.prodi_id}`}
                className="group block w-60 shrink-0 snap-start overflow-hidden rounded-2xl border border-line bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift dark:bg-slate-800/60"
              >
                <div className="relative h-20 bg-gradient-to-br from-primary via-secondary to-accent">
                  <span className="absolute right-3 top-3 text-2xl opacity-90">🔥</span>
                  <span className="absolute left-3 top-3 grid h-7 w-7 place-items-center rounded-lg bg-white/20 text-sm font-bold text-white backdrop-blur">
                    {i + 1}
                  </span>
                </div>
                <div className="p-4">
                  <p className="truncate font-semibold group-hover:text-primary">{row.nama}</p>
                  <p className="truncate text-xs text-muted">
                    {data.ptnById.get(row.ptn_id)?.nama}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <Badge variant="neutral">{row.jenjang}</Badge>
                    <span className="text-xs text-muted">{fmt(value)} peminat</span>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="statistik" className="scroll-mt-24" aria-label="Statistik nasional">
        <Reveal>
          <h2 className="mb-4 text-xl font-bold">Statistik Nasional</h2>
        </Reveal>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Reveal>
            <ChartCard title="Total Peminat per Tahun" badge={<Badge variant="outline">nasional</Badge>}>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats.natSnbp} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="g-pm" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="g-pm2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(148 163 184 / 0.2)" vertical={false} />
                  <XAxis dataKey="tahun" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} width={64} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="peminat"
                    name="SNBP"
                    stroke="#2563eb"
                    strokeWidth={2}
                    fill="url(#g-pm)"
                    animationDuration={900}
                  />
                  <Area
                    type="monotone"
                    dataKey="daya_tampung"
                    name="Daya Tampung"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fill="url(#g-pm2)"
                    animationDuration={900}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </Reveal>

          <Reveal delay={0.05}>
            <ChartCard title="Distribusi Jenjang (SNBP)" badge={<Badge variant="outline">{fmt(stats.jenjang.reduce((a, b) => a + b.value, 0))} prodi</Badge>}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.jenjang}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={70}
                    outerRadius={105}
                    paddingAngle={3}
                    animationDuration={900}
                  >
                    {stats.jenjang.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </Reveal>

          <Reveal>
            <ChartCard
              className="lg:col-span-2"
              title="10 PTN dengan Jurusan Terbanyak (SNBP)"
              badge={<Badge variant="outline">SNBP</Badge>}
            >
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={stats.topPtn} layout="vertical" margin={{ left: 16, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(148 163 184 / 0.2)" horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={210}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <defs>
                    <linearGradient id="g-bar" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#2563eb" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                  <Bar dataKey="value" name="Jumlah Jurusan" fill="url(#g-bar)" radius={[0, 6, 6, 0]} animationDuration={900} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </Reveal>
        </div>
      </section>

      <section id="ranking" className="scroll-mt-24" aria-label="Perankingan">
        <Reveal>
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
            <Medal className="h-5 w-5 text-warning" /> Top Ranking
          </h2>
        </Reveal>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {rankings.map((r, i) => (
            <Reveal key={r.title} delay={i * 0.05}>
              <RankingCard title={r.title} items={r.items} />
            </Reveal>
          ))}
        </div>
      </section>

      <section id="favorit" className="scroll-mt-24" aria-label="Jurusan favorit">
        {favItems.length > 0 ? (
          <Reveal>
            <div className="mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-warning" />
              <h2 className="text-xl font-bold">Jurusan Favorit Anda</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {favItems.map(({ key, row, ptnId, prodiId }) => (
                <Link
                  key={key}
                  to={`/jurusan/${ptnId}/${prodiId}`}
                  className="glass inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
                >
                  <Star className="h-4 w-4 text-warning" fill="currentColor" />
                  {row.nama}
                  {isFavorite(key) ? null : null}
                </Link>
              ))}
            </div>
          </Reveal>
        ) : null}
      </section>
    </div>
  );
}
