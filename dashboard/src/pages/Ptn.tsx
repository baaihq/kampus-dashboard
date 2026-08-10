import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, MapPin } from 'lucide-react';
import { useKampus } from '../context/kampusContext';
import { fmt } from '../lib/format';
import { Badge, EmptyState, FilterChips, Panel, Reveal, SearchInput, SkeletonCard } from '../components/ui';
import type { Ptn } from '../types';

const CATEGORY_STYLES: Record<Ptn['kategori'], { label: string; variant: 'primary' | 'accent' | 'success' }> = {
  akademik: { label: 'PTN Akademik', variant: 'primary' },
  vokasi: { label: 'PTN Vokasi', variant: 'accent' },
  ptkin: { label: 'PTKIN', variant: 'success' },
};

function initials(name: string) {
  return name
    .replace(/^UNIVERSITAS\s+/i, '')
    .replace(/^INSTITUT\s+/i, '')
    .replace(/^ISBI\s+/i, '')
    .split(/\s+/)
    .slice(0, 3)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export default function Ptn() {
  const { data } = useKampus();
  const [kategori, setKategori] = useState('');
  const [search, setSearch] = useState('');

  const rows = useMemo(() => {
    if (!data) return [];
    const stats = new Map<string, { prodiSnbp: number; prodiSnbt: number; dtSnbt: number; pmSnbt: number }>();
    for (const r of data.snbp.values()) {
      const s = stats.get(r.ptn_id) ?? { prodiSnbp: 0, prodiSnbt: 0, dtSnbt: 0, pmSnbt: 0 };
      s.prodiSnbp += 1;
      stats.set(r.ptn_id, s);
    }
    for (const r of data.snbt.values()) {
      const s = stats.get(r.ptn_id) ?? { prodiSnbp: 0, prodiSnbt: 0, dtSnbt: 0, pmSnbt: 0 };
      s.prodiSnbt += 1;
      s.dtSnbt += r.daya_tampung ?? 0;
      s.pmSnbt += r.peminat ?? 0;
      stats.set(r.ptn_id, s);
    }
    const q = search.trim().toLowerCase();
    return data.ptnList
      .filter((p) => {
        if (kategori && p.kategori !== kategori) return false;
        if (q && !`${p.nama} ${p.kab_kota} ${p.provinsi_1}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .map((p) => ({ ptn: p, ...(stats.get(p.id) ?? { prodiSnbp: 0, prodiSnbt: 0, dtSnbt: 0, pmSnbt: 0 }) }))
      .sort((a, b) => b.prodiSnbp - a.prodiSnbp);
  }, [data, kategori, search]);

  if (!data) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Reveal>
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Daftar PTN</h1>
            <p className="mt-1 text-sm text-muted">
              {fmt(data.ptnList.length)} Perguruan Tinggi Negeri · akademik, vokasi, dan PTKIN.
            </p>
          </div>
          <span className="ml-auto rounded-full border border-line bg-white px-4 py-1.5 text-sm font-semibold text-muted dark:border-slate-700 dark:bg-slate-800/60">
            {fmt(rows.length)} PTN
          </span>
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <div className="glass space-y-2 rounded-2xl p-3 shadow-soft dark:shadow-none">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Cari nama PTN, kabupaten, atau provinsi..."
            ariaLabel="Cari PTN"
          />
          <FilterChips
            label="Kategori PTN"
            value={kategori}
            onChange={setKategori}
            options={[
              { value: 'akademik', label: 'PTN Akademik' },
              { value: 'vokasi', label: 'PTN Vokasi' },
              { value: 'ptkin', label: 'PTKIN' },
            ]}
          />
        </div>
      </Reveal>

      {rows.length === 0 ? (
        <Panel>
          <EmptyState
            title="PTN tidak ditemukan"
            description="Coba ubah kata kunci pencarian atau filter kategori."
            action={
              <button
                onClick={() => {
                  setSearch('');
                  setKategori('');
                }}
                className="mt-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-secondary"
              >
                Reset Filter
              </button>
            }
          />
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map(({ ptn, prodiSnbp, prodiSnbt, dtSnbt, pmSnbt }, index) => {
            const style = CATEGORY_STYLES[ptn.kategori];
            const gradient =
              ptn.kategori === 'akademik'
                ? 'from-primary to-secondary'
                : ptn.kategori === 'vokasi'
                ? 'from-accent to-success'
                : 'from-warning to-danger';
            return (
              <Reveal key={ptn.id} delay={(index % 3) * 0.05}>
                <Panel hover className="flex h-full flex-col p-5">
                  <div className="flex items-start gap-3">
                    <span
                      className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${gradient} text-base font-extrabold text-white shadow-glow dark:shadow-none`}
                      aria-hidden="true"
                    >
                      {initials(ptn.nama)}
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate font-bold leading-snug">{ptn.nama}</h2>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {ptn.kab_kota} · {ptn.provinsi_1}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Badge variant={style.variant}>{style.label}</Badge>
                    {ptn.provinsi_2 ? <Badge variant="outline" className="ml-1.5">+ {ptn.provinsi_2}</Badge> : null}
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-slate-50 py-2 dark:bg-slate-800/60">
                      <p className="text-lg font-bold">{fmt(prodiSnbp + prodiSnbt)}</p>
                      <p className="text-[11px] text-muted">Jurusan</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 py-2 dark:bg-slate-800/60">
                      <p className="text-lg font-bold">{fmt(dtSnbt)}</p>
                      <p className="text-[11px] text-muted">Daya Tampung</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 py-2 dark:bg-slate-800/60">
                      <p className="text-lg font-bold">{fmt(pmSnbt)}</p>
                      <p className="text-[11px] text-muted">Peminat</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-line pt-4 dark:border-slate-700">
                    <Link
                      to={`/jurusan?ptn=${ptn.id}`}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-secondary"
                    >
                      Lihat Detail <ArrowRight className="h-4 w-4" />
                    </Link>
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <Building2 className="h-3.5 w-3.5" /> {prodiSnbp} SNBP · {prodiSnbt} SNBT
                    </span>
                  </div>
                </Panel>
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
}
