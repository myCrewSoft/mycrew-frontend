import { createContext, useContext } from 'react';
import { ApiError } from '../../api/axiosInstance';
import type { RankResponse } from '../../types/admin';

export interface AdminRanksContextValue {
  ranks: RankResponse[];
  ranksLoading: boolean;
  ranksError: ApiError | null;
  selectedRankId: string | null;
  selectRank: (rankId: string) => void;
  reloadRanks: () => void;
}

export const AdminRanksContext =
  createContext<AdminRanksContextValue | null>(null);

export const useAdminRanks = () => {
  const context = useContext(AdminRanksContext);

  if (!context) {
    throw new Error('useAdminRanks must be used inside AdminRanksProvider.');
  }

  return context;
};

export const useOptionalAdminRanks = () => useContext(AdminRanksContext);
