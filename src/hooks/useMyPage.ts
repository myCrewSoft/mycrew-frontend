import { useCallback, useEffect, useState } from 'react';
import { mypageApi } from '../api/myPageAPi';
import type { EmployeeMyPage } from '../types/myPage';

export interface MyPageState {
  myPage: EmployeeMyPage | null;
  loading: boolean;
  error: string;
  reload: () => Promise<void>;
}

const emptyText = '-';

export const formatMyPageValue = (
  value: string | number | null | undefined,
  fallback = emptyText,
) => {
  if (value === null || value === undefined) {
    return fallback;
  }

  const text = String(value).trim();
  return text || fallback;
};

export const formatMyPageDate = (value: string | null | undefined) => {
  if (!value) {
    return emptyText;
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

export const getMyPageMeta = (myPage: EmployeeMyPage | null) => {
  if (!myPage) {
    return '마이페이지 정보를 불러오는 중';
  }

  const position =
    myPage.jobPosition?.jobPstnNm ?? myPage.jobGrade?.jobGrdNm ?? null;
  const department = myPage.department?.deptNm ?? null;

  return [position, department].filter(Boolean).join(' · ') || emptyText;
};

export const getMyPageInitial = (myPage: EmployeeMyPage | null) =>
  myPage?.empNm?.trim().charAt(0) || 'U';

export const getRoleNames = (myPage: EmployeeMyPage | null) => {
  const roleNames = Array.from(
    new Set(
      myPage?.roleAssignmentList
        ?.map((assignment) => assignment.role?.roleNm?.trim())
        .filter((roleName): roleName is string => Boolean(roleName)) ?? [],
    ),
  );
  return roleNames.length > 0 ? roleNames.join(', ') : emptyText;
};

export function useMyPage(): MyPageState {
  const [myPage, setMyPage] = useState<EmployeeMyPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMyPage = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await mypageApi.getMyPage();
      setMyPage(response.data.data ?? null);
    } catch (err) {
      setMyPage(null);
      setError(
        err instanceof Error
          ? err.message
          : '마이페이지 정보를 불러오지 못했습니다.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadMyPage();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadMyPage]);

  return { myPage, loading, error, reload: loadMyPage };
}
