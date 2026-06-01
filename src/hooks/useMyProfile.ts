import { useEffect, useState } from 'react';
import { profileApi } from '../api/profileApi';
import type { EmployeeProfile } from '../types/profile';

interface MyProfileState {
  profile: EmployeeProfile | null;
  loading: boolean;
  error: string;
}

export const getProfileMeta = (profile: EmployeeProfile | null) => {
  if (!profile) {
    return '프로필 정보를 불러오는 중';
  }

  const position =
    profile.jobPosition?.jobPstnNm ?? profile.jobGrade?.jobGrdNm ?? null;
  const department = profile.department?.deptNm ?? null;

  return [position, department].filter(Boolean).join(' · ') || '-';
};

export const getProfileInitial = (profile: EmployeeProfile | null) =>
  profile?.empNm?.trim().charAt(0) || 'U';

export function useMyProfile(): MyProfileState {
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await profileApi.getMyProfile();

        if (active) {
          setProfile(response.data.data ?? null);
        }
      } catch (err) {
        if (active) {
          setProfile(null);
          setError(
            err instanceof Error
              ? err.message
              : '프로필 정보를 불러오지 못했습니다.',
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      active = false;
    };
  }, []);

  return { profile, loading, error };
}
