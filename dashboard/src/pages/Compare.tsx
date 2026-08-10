import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ComposedChart,
} from 'recharts';
import { ArrowRight, Search, Trophy, Zap } from 'lucide-react';
import { useKampus } from '../context/kampusContext';
import { prodiKey } from '../lib/keys';
import { fmtPct, rasio, YEARS } from '../lib/format';
import { ChartCard, Badge, Panel, ProgressBar, Reveal, SkeletonCard } from '../components/ui';
import { ChartTooltip } from '../components/charts';
import type { DetailRecord, ProdiRow } from '../types';

interface Selection {
  base: ProdiRow;
  snbp?: ProdiRow;
  snbt?: ProdiRow;
  dSnbp?: DetailRecord;
  dSnbt?: DetailRecord;
  ptnName: string;
}

export default function Compare() {
  const { data } = useKampus();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const suggestions = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const keys = new Set<string>();
    for (const r of data.snbp.values()) keys.add(prodiKey(r.ptn_id, r.prodi_id));
    for (const r of data.snbt.values()) keys.add(prodiKey(r.ptn_id, r.prodi_id));
    const result: { key: string; nama: string; ptn: string }[] = [];
    for (const k of keys) {
      const snbp = data.snbp.get(k);
      const snbt = data.snbt.get(k);
      const base = snbp ?? snbt!;
      const ptn = data.ptnById.get(base.ptn_id)?.nama ?? '';
      const hay = `${base.nama} ${ptn}`.toLowerCase();
      if (!hay.includes(q)) continue;
      result.push({ key: k, nama: base.nama, ptn });
      if (result.length >= 20) break;
    }
    return result;
  }, [data, query]);

  const selection = useMemo<Selection | null>(() => {
    if (!data || !selected) return null;
    const snbp = data.snbp.get(selected);
    const snbt = data.snbt.get(selected);
    if (!snbp && !snbt) return null;
    const base = snbp ?? snbt!;
    return {
      base,
      snbp,
      snbt,
      dSnbp: data.detailSnbp.get(selected),
      dSnbt: data.detailSnbt.get(selected),
      ptnName: data.ptnById.get(base.ptn_id)?.nama ?? '',
    };
  }, [data, selected]);

  const trend = useMemo(() => {
    if (!selection) return [];
    return YEARS.map((year) => ({
      tahun: year,
      snbp_peminat: selection.dSnbp?.sebaran?.[year]?.peminat ?? null,
      snbt_peminat: selection.dSnbt?.sebaran?.[year]?.peminat ?? null,
      snbp_dt: selection.dSnbp?.sebaran?.[year]?.daya_tampung ?? null,
      snbt_dt: selection.dSnbt?.sebaran?.[year]?.daya_tampung ?? null,
      snbp_pct: selection.dSnbp?.sebaran?.[year]?.persentase ?? null,
      snbt_pct: selection.dSnbt?.sebaran?.[year]?.persentase ?? null,
    }));
  }, [selection]);

  const radar = useMemo(() => {
    if (!selection) return [];
    interface RadarMetric {
      label: string;
      snbp: number;
      snbt: number;
      kind: 'low' | 'high';
    }
    const raw: RadarMetric[] = [
      {
        label: 'Peminat 2023',
        snbp: selection.dSnbp?.sebaran?.['2023']?.peminat ?? 0,
        snbt: selection.dSnbt?.sebaran?.['2023']?.peminat ?? 0,
        kind: 'high',
      },
      {
        label: 'Peminat 2024',
        snbp: selection.dSnbp?.sebaran?.['2024']?.peminat ?? 0,
        snbt: selection.dSnbt?.sebaran?.['2024']?.peminat ?? 0,
        kind: 'high',
      },
      {
        label: 'Peminat 2025',
        snbp: selection.snbp?.peminat ?? 0,
        snbt: selection.snbt?.peminat ?? 0,
        kind: 'high',
      },
      {
        label: 'Daya Tampung 2026',
        snbp: selection.snbp?.daya_tampung ?? 0,
        snbt: selection.snbt?.daya_tampung ?? 0,
        kind: 'high',
      },
      {
        label: 'Rasio 2025',
        snbp: rasio(selection.snbp?.daya_tampung, selection.snbp?.peminat) ?? 0,
        snbt: rasio(selection.snbt?.daya_tampung, selection.snbt?.peminat) ?? 0,
        kind: 'low',
      },
    ];
    return raw.map((m) => {
      const max = Math.max(m.snbp, m.snbt, 1);
      const better =
        m.snbp === m.snbt
          ? 'tie'
          : m.kind === 'high'
          ? m.snbp > m.snbt
            ? 'snbp'
            : 'snbt'
          : m.snbp < m.snbt
          ? 'snbp'
          : 'snbt';
      return { ...m, better, snbp: (m.snbp / max) * 100, snbt: (m.snbt / max) * 100 };
    });
  }, [selection]);

  if (!data) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  const rsbp = rasio(selection?.snbp?.daya_tampung, selection?.snbp?.peminat);
  const rsbt = rasio(selection?.snbt?.daya_tampung, selection?.snbt?.peminat);

  return (
    <div className="space-y-6">
      <Reveal>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Perbandingan SNBP vs SNBT</h1>
          <p className="mt-1 text-sm text-muted">
            Pilih satu jurusan untuk membandingkan peminat, daya tampung, dan rasio keketatan antara
            SNBP dan SNBT.
          </p>
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <div className="glass rounded-2xl p-4 shadow-soft dark:shadow-none">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelected(null);
              }}
              placeholder="Ketik minimal 2 huruf nama jurusan / PTN..."
              aria-label="Cari jurusan untuk dibandingkan"
              className="w-full rounded-full border border-line bg-white py-3 pl-12 pr-4 text-sm shadow-soft transition-shadow focus:border-primary focus:shadow-glow focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100"
            />
          </div>
          {suggestions.length > 0 && !selected ? (
            <ul className="mt-3 max-h-72 overflow-auto rounded-2xl border border-line dark:border-slate-700">
              {suggestions.map((s) => (
                <li key={s.key}>
                  <button
                    onClick={() => {
                      setSelected(s.key);
                      setQuery(s.nama);
                    }}
                    className="flex w-full items-baseline justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-primary/5"
                  >
                    <span className="font-medium">{s.nama}</span>
                    <span className="truncate text-xs text-muted">{s.ptn}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Reveal>

      {!selection ? (
        <Panel>
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-glow">
              <Zap className="h-7 w-7" />
            </div>
            <div>
              <p className="font-semibold">Pilih jurusan untuk memulai</p>
              <p className="mt-1 text-sm text-muted">
                Hasil perbandingan akan ditampilkan di sini secara langsung.
              </p>
            </div>
          </div>
        </Panel>
      ) : (
        <>
          <Reveal>
            <Panel className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <h2 className="text-lg font-bold">{selection.base.nama}</h2>
                <p className="text-sm text-muted">
                  {selection.ptnName} · {selection.base.jenjang}
                </p>
              </div>
              <div className="flex gap-2">
                <Badge variant="primary">SNBP</Badge>
                <Badge variant="success">SNBT</Badge>
              </div>
            </Panel>
          </Reveal>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto_1fr]">
            <Reveal>
              <Panel className="h-full border-blue-200/70 p-6 dark:border-blue-900/40">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-primary">SNBP</h3>
                  <Badge variant="primary">Prestasi</Badge>
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'Daya Tampung 2026', value: selection.snbp?.daya_tampung, better: selection.snbp?.daya_tampung !== undefined && (selection.snbp?.daya_tampung ?? 0) >= (selection.snbt?.daya_tampung ?? 0) },
                    { label: 'Peminat 2025', value: selection.snbp?.peminat, better: (selection.snbp?.peminat ?? 0) >= (selection.snbt?.peminat ?? 0) },
                    { label: 'Rasio Keketatan 2025', value: rsbp !== null ? `${fmtPct(rsbp, 2)}` : '—', better: rsbp !== null && rsbt !== null && rsbp <= rsbt },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-xl bg-blue-50/60 p-3 dark:bg-blue-900/20">
                      <span className="text-sm text-muted">{item.label}</span>
                      <span className="flex items-center gap-2 font-mono text-lg font-bold text-primary">
                        {item.value ?? '—'}
                        {item.better ? <Trophy className="h-4 w-4 text-warning" /> : null}
                      </span>
                    </div>
                  ))}
                </div>
              </Panel>
            </Reveal>

            <Reveal delay={0.05}>
              <div className="flex items-center justify-center py-4">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-lg font-extrabold text-white shadow-glow dark:shadow-none">
                  VS
                </span>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <Panel className="h-full border-emerald-200/70 p-6 dark:border-emerald-900/40">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-emerald-700 dark:text-emerald-400">SNBT</h3>
                  <Badge variant="success">Tes</Badge>
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'Daya Tampung 2026', value: selection.snbt?.daya_tampung, better: (selection.snbt?.daya_tampung ?? 0) >= (selection.snbp?.daya_tampung ?? 0) },
                    { label: 'Peminat 2025', value: selection.snbt?.peminat, better: (selection.snbt?.peminat ?? 0) >= (selection.snbp?.peminat ?? 0) },
                    { label: 'Rasio Keketatan 2025', value: rsbt !== null ? `${fmtPct(rsbt, 2)}` : '—', better: rsbt !== null && rsbp !== null && rsbt <= rsbp },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-xl bg-emerald-50/60 p-3 dark:bg-emerald-900/20">
                      <span className="text-sm text-muted">{item.label}</span>
                      <span className="flex items-center gap-2 font-mono text-lg font-bold text-emerald-700 dark:text-emerald-400">
                        {item.value ?? '—'}
                        {item.better ? <Trophy className="h-4 w-4 text-warning" /> : null}
                      </span>
                    </div>
                  ))}
                </div>
              </Panel>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Reveal>
              <ChartCard title="Profil Perbandingan" badge={<Badge variant="outline">radar</Badge>}>
                <ResponsiveContainer width="100%" height={320}>
                  <RadarChart data={radar} outerRadius={110}>
                    <PolarGrid stroke="rgb(148 163 184 / 0.25)" />
                    <PolarAngleAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Radar name="SNBP" dataKey="snbp" stroke="#2563eb" fill="#2563eb" fillOpacity={0.25} animationDuration={800} />
                    <Radar name="SNBT" dataKey="snbt" stroke="#10b981" fill="#10b981" fillOpacity={0.25} animationDuration={800} />
                    <Legend />
                    <Tooltip content={<ChartTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </ChartCard>
            </Reveal>

            <Reveal delay={0.05}>
              <Panel className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-semibold">Perbandingan Metrik</h2>
                  <Badge variant="outline">2025–2026</Badge>
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'Peminat 2025', a: selection.snbp?.peminat ?? 0, b: selection.snbt?.peminat ?? 0 },
                    { label: 'Daya Tampung 2026', a: selection.snbp?.daya_tampung ?? 0, b: selection.snbt?.daya_tampung ?? 0 },
                    { label: 'Rasio 2025', a: rsbp ?? 0, b: rsbt ?? 0 },
                  ].map((m) => {
                    const max = Math.max(m.a, m.b, 1);
                    return (
                      <div key={m.label}>
                        <p className="mb-1.5 text-sm font-medium">{m.label}</p>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="w-10 text-xs font-semibold text-primary">SNBP</span>
                            <ProgressBar value={(m.a / max) * 100} color="bg-gradient-to-r from-primary to-secondary" className="flex-1" />
                            <span className="w-16 text-right font-mono text-xs">{fmtPct(m.a, m.label === 'Rasio 2025' ? 2 : 0)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-10 text-xs font-semibold text-emerald-700 dark:text-emerald-400">SNBT</span>
                            <ProgressBar value={(m.b / max) * 100} color="bg-gradient-to-r from-success to-accent" className="flex-1" />
                            <span className="w-16 text-right font-mono text-xs">{fmtPct(m.b, m.label === 'Rasio 2025' ? 2 : 0)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Panel>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Reveal>
              <ChartCard title="Tren Peminat per Tahun">
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgb(148 163 184 / 0.2)" vertical={false} />
                    <XAxis dataKey="tahun" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} width={60} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend />
                    <Line dataKey="snbp_peminat" name="SNBP" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} animationDuration={800} />
                    <Line dataKey="snbt_peminat" name="SNBT" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} animationDuration={800} />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>
            </Reveal>

            <Reveal delay={0.05}>
              <ChartCard title="Tren Rasio Keketatan (%) per Tahun">
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgb(148 163 184 / 0.2)" vertical={false} />
                    <XAxis dataKey="tahun" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis unit="%" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} width={48} />
                    <Tooltip content={<ChartTooltip percent />} />
                    <Legend />
                    <Line dataKey="snbp_pct" name="SNBP" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} animationDuration={800} />
                    <Line dataKey="snbt_pct" name="SNBT" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} animationDuration={800} />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartCard>
            </Reveal>
          </div>

          <Reveal>
            <div className="flex justify-end">
              <a
                href={`/jurusan/${selection.base.ptn_id}/${selection.base.prodi_id}`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-secondary"
              >
                Lihat halaman detail jurusan ini <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </Reveal>
        </>
      )}
    </div>
  );
}
