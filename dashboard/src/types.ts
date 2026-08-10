export type Seleksi = 'snbp' | 'snbt';

export interface Ptn {
  id: string;
  kode: string;
  nama: string;
  website: string;
  kab_kota: string;
  provinsi_1: string;
  provinsi_2: string;
  kategori: 'akademik' | 'vokasi' | 'ptkin';
}

export interface ProdiRow {
  ptn_id: string;
  seleksi: Seleksi;
  prodi_id: string;
  kode: string;
  nama: string;
  jenjang: string;
  daya_tampung: number | null;
  peminat: number | null;
  portofolio: string;
  label_daya_tampung?: string;
  label_peminat?: string;
}

export interface SebaranYear {
  peminat?: number | null;
  daya_tampung?: number | null;
  persentase?: number | null;
}

export interface DetailRecord {
  ptn_id: string;
  seleksi: Seleksi;
  prodi_id: string;
  kode: string | null;
  nama: string | null;
  jenjang: string | null;
  portofolio: string | null;
  sebaran: Record<string, SebaranYear>;
  peminat_per_prov: Record<string, Record<string, number | null>>;
}

export interface ApiFile<T> {
  crawled_at: string;
  count: number;
  items: T[];
}
