import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import { ApiError } from '../../api/axiosInstance';
import type { RankResponse } from '../../types/admin';
import { AdminRanksContext } from './adminRanksHooks';

const toApiError = (err: unknown) =>
  err instanceof ApiError
    ? err
    : new ApiError((err as Error).message, 'UNKNOWN', 0);

const sortRanks = (ranks: RankResponse[]) =>
  [...ranks].sort(
    (left, right) =>
      left.sortOrder - right.sortOrder ||
      left.rankName.localeCompare(right.rankName, 'ko'),
  );

const getTopRank = (ranks: RankResponse[]) => sortRanks(ranks)[0];

export function AdminRanksProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedRankId = searchParams.get('rankId');
  const [ranks, setRanks] = useState<RankResponse[]>([]);
  const [ranksLoading, setRanksLoading] = useState(true);
  const [ranksError, setRanksError] = useState<ApiError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const selectRank = useCallback(
    (rankId: string) => {
      navigate(`/admin/ranks?rankId=${encodeURIComponent(rankId)}`);
    },
    [navigate],
  );

  const reloadRanks = useCallback(() => {
    setReloadKey((current) => current + 1);
  }, []);

  useEffect(() => {
    let active = true;

    const loadRanks = async () => {
      setRanksLoading(true);
      setRanksError(null);

      try {
        const response = await adminApi.getRanks();
        const nextRanks = sortRanks(response.data.data ?? []);

        if (!active) {
          return;
        }

        setRanks(nextRanks);

        const hasSelectedRank = nextRanks.some(
          (rank) => rank.rankId === selectedRankId,
        );
        const topRank = getTopRank(nextRanks);

        if (topRank && !hasSelectedRank) {
          navigate(`/admin/ranks?rankId=${topRank.rankId}`, {
            replace: true,
          });
        }

        if (nextRanks.length === 0 && selectedRankId) {
          navigate('/admin/ranks', { replace: true });
        }
      } catch (err) {
        if (active) {
          setRanks([]);
          setRanksError(toApiError(err));
        }
      } finally {
        if (active) {
          setRanksLoading(false);
        }
      }
    };

    void loadRanks();

    return () => {
      active = false;
    };
  }, [navigate, reloadKey, selectedRankId]);

  const value = useMemo(
    () => ({
      ranks,
      ranksLoading,
      ranksError,
      selectedRankId,
      selectRank,
      reloadRanks,
    }),
    [ranks, ranksError, ranksLoading, reloadRanks, selectRank, selectedRankId],
  );

  return (
    <AdminRanksContext.Provider value={value}>
      {children}
    </AdminRanksContext.Provider>
  );
}
