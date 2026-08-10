export interface ProdiLike {
  sebaran?: Record<
    string,
    { peminat?: number | null; daya_tampung?: number | null; persentase?: number | null }
  >;
}
