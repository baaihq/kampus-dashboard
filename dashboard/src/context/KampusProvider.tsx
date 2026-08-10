import { useEffect, useState, type ReactNode } from 'react';
import type { ApiFile, DetailRecord, ProdiRow, Ptn } from '../types';
import { prodiKey } from '../lib/keys';
import { KampusContext, type KampusContextValue, type KampusData } from './kampusContext';

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Gagal memuat ${url} (${response.status})`);
  }
  return response.json();
}

export function KampusProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<KampusContextValue>({ data: null, loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [ptnFile, snbpFile, snbtFile, dSnbp, dSnbt] = await Promise.all([
          fetchJson<ApiFile<Ptn>>('/data/ptn.json'),
          fetchJson<ApiFile<ProdiRow>>('/data/prodi_snbp.json'),
          fetchJson<ApiFile<ProdiRow>>('/data/prodi_snbt.json'),
          fetchJson<ApiFile<DetailRecord>>('/data/detail_snbp.json'),
          fetchJson<ApiFile<DetailRecord>>('/data/detail_snbt.json'),
        ]);
        if (cancelled) return;
        const data: KampusData = {
          ptnList: ptnFile.items,
          ptnById: new Map(ptnFile.items.map((p) => [p.id, p])),
          snbp: new Map(snbpFile.items.map((r) => [prodiKey(r.ptn_id, r.prodi_id), r])),
          snbt: new Map(snbtFile.items.map((r) => [prodiKey(r.ptn_id, r.prodi_id), r])),
          detailSnbp: new Map(dSnbp.items.map((r) => [prodiKey(r.ptn_id, r.prodi_id), r])),
          detailSnbt: new Map(dSnbt.items.map((r) => [prodiKey(r.ptn_id, r.prodi_id), r])),
        };
        setValue({ data, loading: false, error: null });
      } catch (err) {
        if (!cancelled) {
          setValue({ data: null, loading: false, error: err instanceof Error ? err.message : String(err) });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return <KampusContext.Provider value={value}>{children}</KampusContext.Provider>;
}
