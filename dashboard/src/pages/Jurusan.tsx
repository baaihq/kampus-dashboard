import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useKampus } from '../context/kampusContext';
import { prodiKey } from '../lib/keys';
import { useRecentSearches } from '../lib/hooks';
import { fmt, fmtPct, rasio } from '../lib/format';
import DataTable, { type DataColumn } from '../components/DataTable';
import { Badge, FilterChips, Panel, Reveal, SearchInput, Skeleton, SkeletonCard } from '../components/ui';
import type { ProdiRow } from '../types';

interface MergedRow {
  ptn_id: string;
  prodi_id: string;
  nama: string;
  jenjang: string;
  snbp?: ProdiRow;
  snbt?: ProdiRow;
}

const PAGE_SIZE = 100;

function KetatBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted">—</span>;
  if (value < 2) return <Badge variant="danger">Sangat Ketat</Badge>;
  if (value < 5) return <Badge variant="warning">Ketat</Badge>;
  if (value < 10) return <Badge variant="primary">Cukup</Badge>;
  return <Badge variant="success">Leluasa</Badge>;
}

export default function Jurusan() {
  const { data } = useKampus();
  const [params] = useSearchParams();
  const { recent, addRecent, clearRecent } = useRecentSearches();

  const [search, setSearch] = useState(params.get('q') ?? '');
  const [ptnId, setPtnId] = useState(params.get('ptn') ?? '');
  const [provinsi, setProvinsi] = useState('');
  const [jenjang, setJenjang] = useState('');
  const [kategori, setKategori] = useState('');
  const [visible, setVisible] = useState(PAGE_SIZE);

  const rows = useMemo<MergedRow[]>(() => {
    if (!data) return [];
    const keys = new Set<string>();
    for (const r of data.snbp.values()) keys.add(prodiKey(r.ptn_id, r.prodi_id));
    for (const r of data.snbt.values()) keys.add(prodiKey(r.ptn_id, r.prodi_id));
    const merged: MergedRow[] = [];
    for (const k of keys) {
      const snbp = data.snbp.get(k);
      const snbt = data.snbt.get(k);
      if (!snbp && !snbt) continue;
      const base = (snbp ?? snbt) as ProdiRow;
      merged.push({
        ptn_id: base.ptn_id,
        prodi_id: base.prodi_id,
        nama: base.nama,
        jenjang: base.jenjang,
        snbp,
        snbt,
      });
    }
    return merged;
  }, [data]);

  const options = useMemo(() => {
    if (!data) return { provinsis: [], ptnList: [] as { id: string; nama: string }[], jenjangs: [] as string[] };
    const provinsiSet = new Set<string>();
    for (const p of data.ptnList) {
      if (p.provinsi_1) provinsiSet.add(p.provinsi_1);
      if (p.provinsi_2) provinsiSet.add(p.provinsi_2);
    }
    const jenjangSet = new Set<string>();
    for (const r of data.snbp.values()) jenjangSet.add(r.jenjang);
    for (const r of data.snbt.values()) jenjangSet.add(r.jenjang);
    return {
      provinsis: Array.from(provinsiSet).sort(),
      ptnList: data.ptnList.map((p) => ({ id: p.id, nama: p.nama })),
      jenjangs: Array.from(jenjangSet).sort(),
    };
  }, [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const result = rows.filter((r) => {
      const ptn = data?.ptnById.get(r.ptn_id);
      if (ptnId && r.ptn_id !== ptnId) return false;
      if (kategori && ptn?.kategori !== kategori) return false;
      if (jenjang && r.jenjang !== jenjang) return false;
      if (provinsi && !(ptn?.provinsi_1 === provinsi || ptn?.provinsi_2 === provinsi)) return false;
      if (q) {
        const hay = `${r.nama} ${ptn?.nama ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    return result;
  }, [rows, data, search, ptnId, provinsi, jenjang, kategori]);

  const columns: DataColumn<MergedRow>[] = [
    {
      key: 'nama',
      header: 'Jurusan',
      align: 'left',
      sortValue: (r) => r.nama,
      render: (r) => (
        <Link
          to={`/jurusan/${r.ptn_id}/${r.prodi_id}`}
          className="font-semibold text-ink transition-colors hover:text-primary dark:text-slate-100"
        >
          {r.nama}
        </Link>
      ),
      className: 'min-w-[180px]',
    },
    {
      key: 'ptn',
      header: 'PTN',
      align: 'left',
      sortValue: (r) => data?.ptnById.get(r.ptn_id)?.nama ?? '',
      render: (r) => (
        <span className="whitespace-nowrap text-muted">{data?.ptnById.get(r.ptn_id)?.nama ?? r.ptn_id}</span>
      ),
      className: 'min-w-[180px]',
    },
    {
      key: 'jenjang',
      header: 'Jenjang',
      align: 'left',
      sortValue: (r) => r.jenjang,
      render: (r) => <Badge variant="neutral">{r.jenjang}</Badge>,
    },
    {
      key: 'provinsi',
      header: 'Provinsi',
      align: 'left',
      sortValue: (r) => data?.ptnById.get(r.ptn_id)?.provinsi_1 ?? '',
      render: (r) => (
        <span className="whitespace-nowrap text-muted">{data?.ptnById.get(r.ptn_id)?.provinsi_1 ?? ''}</span>
      ),
    },
    {
      key: 'dt_snbp',
      header: 'DT',
      group: 'SNBP',
      align: 'right',
      sortValue: (r) => r.snbp?.daya_tampung ?? null,
      render: (r) => <span className="font-mono">{fmt(r.snbp?.daya_tampung)}</span>,
    },
    {
      key: 'pm_snbp',
      header: 'Peminat',
      group: 'SNBP',
      align: 'right',
      sortValue: (r) => r.snbp?.peminat ?? null,
      render: (r) => <span className="font-mono">{fmt(r.snbp?.peminat)}</span>,
    },
    {
      key: 'rasio_snbp',
      header: 'Rasio',
      group: 'SNBP',
      align: 'right',
      sortValue: (r) => rasio(r.snbp?.daya_tampung, r.snbp?.peminat),
      render: (r) => {
        const value = rasio(r.snbp?.daya_tampung, r.snbp?.peminat);
        return (
          <span className={`font-mono ${value !== null && value <= 5 ? 'text-danger' : 'text-muted'}`}>
            {fmtPct(value, 2)}
          </span>
        );
      },
    },
    {
      key: 'dt_snbt',
      header: 'DT',
      group: 'SNBT',
      align: 'right',
      sortValue: (r) => r.snbt?.daya_tampung ?? null,
      render: (r) => <span className="font-mono">{fmt(r.snbt?.daya_tampung)}</span>,
    },
    {
      key: 'pm_snbt',
      header: 'Peminat',
      group: 'SNBT',
      align: 'right',
      sortValue: (r) => r.snbt?.peminat ?? null,
      render: (r) => <span className="font-mono">{fmt(r.snbt?.peminat)}</span>,
    },
    {
      key: 'rasio_snbt',
      header: 'Rasio',
      group: 'SNBT',
      align: 'right',
      sortValue: (r) => rasio(r.snbt?.daya_tampung, r.snbt?.peminat),
      render: (r) => {
        const value = rasio(r.snbt?.daya_tampung, r.snbt?.peminat);
        return (
          <span className={`font-mono ${value !== null && value <= 5 ? 'text-danger' : 'text-muted'}`}>
            {fmtPct(value, 2)}
          </span>
        );
      },
    },
    {
      key: 'keketatan',
      header: 'Keketatan',
      align: 'center',
      render: (r) => <KetatBadge value={rasio(r.snbt?.daya_tampung, r.snbt?.peminat)} />,
      className: 'min-w-[120px]',
    },
  ];

  const groups = {
    SNBP: {
      label: <span className="text-blue-700 dark:text-sky-400">SNBP</span>,
      className:
        'border-l border-line text-blue-700 dark:border-slate-700 dark:text-sky-400',
    },
    SNBT: {
      label: <span className="text-emerald-700 dark:text-emerald-400">SNBT</span>,
      className:
        'border-l border-line text-emerald-700 dark:border-slate-700 dark:text-emerald-400',
    },
  };

  const selectClass =
    'rounded-xl border border-line bg-white px-2 py-2 text-sm text-ink shadow-soft focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100';

  return (
    <div className="space-y-5">
      <Reveal>
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Daftar Jurusan</h1>
            <p className="mt-1 text-sm text-muted">
              Jelajahi seluruh jurusan PTN dengan data SNBP &amp; SNBT.
            </p>
          </div>
          {data ? (
            <span className="ml-auto rounded-full border border-line bg-white px-4 py-1.5 text-sm font-semibold text-muted dark:border-slate-700 dark:bg-slate-800/60">
              {fmt(filtered.length)} jurusan
            </span>
          ) : null}
        </div>
      </Reveal>

      <div className="sticky top-[72px] z-20 space-y-3">
        <Reveal>
          <div className="glass rounded-2xl p-3 shadow-soft dark:shadow-none">
            <SearchInput
              value={search}
              onChange={(v) => {
                setSearch(v);
                setVisible(PAGE_SIZE);
              }}
              onCommit={() => addRecent(search)}
              placeholder="Cari jurusan atau nama PTN..."
              ariaLabel="Cari jurusan atau PTN"
              recent={recent}
              onRecentClick={(term) => {
                setSearch(term);
                setVisible(PAGE_SIZE);
              }}
              onRecentClear={clearRecent}
            />

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              <FilterChips
                label="Kategori PTN"
                value={kategori}
                onChange={(v) => {
                  setKategori(v);
                  setVisible(PAGE_SIZE);
                }}
                options={[
                  { value: 'akademik', label: 'PTN Akademik' },
                  { value: 'vokasi', label: 'Vokasi' },
                  { value: 'ptkin', label: 'PTKIN' },
                ]}
              />
              <span className="hidden h-5 w-px bg-line sm:block dark:bg-slate-700" />
              <FilterChips
                label="Jenjang"
                value={jenjang}
                onChange={(v) => {
                  setJenjang(v);
                  setVisible(PAGE_SIZE);
                }}
                options={options.jenjangs.map((j) => ({ value: j, label: j }))}
              />
              <span className="hidden h-5 w-px bg-line sm:block dark:bg-slate-700" />
              <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                <select
                  value={ptnId}
                  onChange={(e) => {
                    setPtnId(e.target.value);
                    setVisible(PAGE_SIZE);
                  }}
                  className={`${selectClass} min-w-0 flex-1 sm:flex-none`}
                  aria-label="Filter PTN"
                >
                  <option value="">Semua PTN</option>
                  {options.ptnList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nama}
                    </option>
                  ))}
                </select>
                <select
                  value={provinsi}
                  onChange={(e) => {
                    setProvinsi(e.target.value);
                    setVisible(PAGE_SIZE);
                  }}
                  className={`${selectClass} min-w-0 flex-1 sm:flex-none`}
                  aria-label="Filter provinsi"
                >
                  <option value="">Semua Provinsi</option>
                  {options.provinsis.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      {!data ? (
        <div className="space-y-4">
          <Skeleton className="h-14 w-full" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      ) : (
        <Reveal>
          <Panel className="overflow-hidden p-0">
            <DataTable
              columns={columns}
              rows={filtered}
              rowKey={(r) => prodiKey(r.ptn_id, r.prodi_id)}
              groups={groups}
              initialSort={{ key: 'nama', dir: 'asc' }}
              defaultDescKeys={['dt_snbp', 'pm_snbp', 'rasio_snbp', 'dt_snbt', 'pm_snbt', 'rasio_snbt']}
              limit={visible}
              maxHeight="calc(100vh - 340px)"
              emptyTitle="Tidak ada jurusan yang cocok"
              emptyDescription="Coba ubah kata kunci pencarian atau filter yang digunakan."
              footer={
                visible < filtered.length ? (
                  <div className="p-4 text-center">
                    <button
                      onClick={() => setVisible((v) => v + PAGE_SIZE)}
                      className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-all hover:-translate-y-0.5 hover:bg-secondary dark:shadow-none"
                    >
                      Muat lebih banyak · {fmt(filtered.length - visible)} tersisa
                    </button>
                  </div>
                ) : null
              }
            />
          </Panel>
        </Reveal>
      )}
    </div>
  );
}
