export function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined) return '-';
  return new Intl.NumberFormat('id-ID').format(n);
}

export function fmtPct(n: number | null | undefined, digits = 2): string {
  if (n === null || n === undefined) return '-';
  return `${n.toFixed(digits)}%`;
}

export function rasio(
  dayaTampung: number | null | undefined,
  peminat: number | null | undefined
): number | null {
  if (dayaTampung !== null && dayaTampung !== undefined && peminat !== null && peminat !== undefined && peminat > 0) {
    return (dayaTampung / peminat) * 100;
  }
  return null;
}

export const YEARS = ['2021', '2022', '2023', '2024', '2025'];

export interface TrendPoint {
  tahun: string;
  peminat: number | null;
  daya_tampung: number | null;
  persentase: number | null;
}

export interface SebaranLike {
  sebaran?: Record<string, { peminat?: number | null; daya_tampung?: number | null; persentase?: number | null }>;
}

export function toTrend(detail?: SebaranLike): TrendPoint[] {
  return YEARS.map((tahun) => ({
    tahun,
    peminat: detail?.sebaran?.[tahun]?.peminat ?? null,
    daya_tampung: detail?.sebaran?.[tahun]?.daya_tampung ?? null,
    persentase: detail?.sebaran?.[tahun]?.persentase ?? null,
  }));
}
