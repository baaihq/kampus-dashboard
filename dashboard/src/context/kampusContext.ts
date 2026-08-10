import { createContext, useContext } from 'react';
import type { DetailRecord, ProdiRow, Ptn } from '../types';

export interface KampusData {
  ptnList: Ptn[];
  ptnById: Map<string, Ptn>;
  snbp: Map<string, ProdiRow>;
  snbt: Map<string, ProdiRow>;
  detailSnbp: Map<string, DetailRecord>;
  detailSnbt: Map<string, DetailRecord>;
}

export interface KampusContextValue {
  data: KampusData | null;
  loading: boolean;
  error: string | null;
}

export const KampusContext = createContext<KampusContextValue>({
  data: null,
  loading: true,
  error: null,
});

export function useKampus(): KampusContextValue {
  return useContext(KampusContext);
}
