/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback } from 'react';
import type { AxiosResponse } from 'axios';
import { ApiError } from '../api/axiosInstance';
import type { ApiResponse, PageInfo } from '../api/axiosInstance';

// ── 타입 정의 ─────────────────────────────────────────────────────

/**
 * API 호출 함수의 타입.
 * axios.ts 인터셉터가 response 전체(AxiosResponse)를 반환하므로
 * 반환 타입을 AxiosResponse<ApiResponse<T>> 로 선언한다.
 */
type ApiCallFn<TData, TArgs extends unknown[] = any[]> = (...args: TArgs) => Promise<AxiosResponse<ApiResponse<TData>>>;

/**
 * useApi / useApiList 훅의 옵션 타입.
 *
 * immediate      true 이면 마운트 시 자동 호출. 기본값: true
 * initialData    data 의 초기값. 기본값: null
 * immediateArgs  immediate: true 일 때 마운트 시 execute 에 전달할 인자 목록.
 *
 * [immediateArgs 사용 시 주의]
 * immediateArgs 는 마운트 시점의 값으로 단 1회 호출된다.
 * 상태(State) 값을 immediateArgs 에 넣어도 해당 상태 변경 시 자동 재호출되지 않는다.
 * 상태 변화에 따라 API 를 재호출해야 하는 경우(페이지네이션, 검색 필터 등)
 * immediate: false 로 설정한 뒤 컴포넌트 단에서 직접 useEffect 로 관리한다.
 *
 * @example 상태 변화에 따른 재호출 패턴
 * const { data, execute } = useApiList(boardApi.getBoards, { immediate: false });
 * useEffect(() => {
 * void execute({ page, filter });
 * }, [page, filter, execute]); // execute 참조가 고정되어 있어 완전히 안전하다
 */
interface UseApiOptions<TData, TArgs extends unknown[]> {
  immediate?: boolean;
  initialData?: TData | null;
  immediateArgs?: TArgs;
}

/**
 * useApi 훅의 반환 타입.
 * execute 의 반환값은 AxiosResponse 가 아닌 ApiResponse<T> 다.
 * 인터셉터에서 response.data 를 꺼내 반환하므로 소비자는 ApiResponse 만 다루면 된다.
 */
interface UseApiReturn<TData, TArgs extends unknown[]> {
  data: TData | null;
  loading: boolean;
  error: ApiError | null;
  execute: (...args: TArgs) => Promise<ApiResponse<TData>>; // 타입 안정성 확보!
  reset: () => void;
}

/**
 * useApiList 훅의 반환 타입.
 * useApi 와 동일하지만 pagination 상태를 추가로 제공한다.
 * TArgs를 제네릭으로 추가하여 Omit된 execute에 정확한 인자 타입을 주입한다.
 */
interface UseApiListReturn<TData, TArgs extends unknown[]> 
  extends Omit<UseApiReturn<TData[], TArgs>, 'execute'> {
  pagination: PageInfo | null;
  // unknown[] 대신 TArgs를 사용하여 타입 안정성을 확보합니다.
  execute: (...args: TArgs) => Promise<ApiResponse<TData[]>>;
}

// ── useApi ────────────────────────────────────────────────────────

/**
 * 비동기 API 호출의 loading / error / data 상태를 자동으로 관리하는 커스텀 훅.
 * 컴포넌트마다 useState + try-catch 를 반복 작성할 필요 없이 이 훅만 사용하면 된다.
 *
 * [핵심 설계 원칙 1 — apiCall ref 고정]
 * apiCall 을 useRef 로 래핑하여 execute 참조를 마운트 시 1회만 생성하고 고정한다.
 * 인라인 익명 함수로 apiCall 을 넘겨도 execute 참조가 변하지 않아
 * 자식 컴포넌트 props 나 다른 useEffect 의존성 배열에 넣어도 무한 루프가 발생하지 않는다.
 *
 * [핵심 설계 원칙 2 — 언마운트 안전 처리]
 * isMountedRef 로 컴포넌트 마운트 여부를 추적한다.
 * 네트워크가 느린 환경에서 응답 도착 전 페이지를 이탈(언마운트)하면,
 * 뒤늦게 도착한 응답이 setState 를 호출해 React 경고 또는 메모리 누수가 발생할 수 있다.
 * 언마운트 이후에는 모든 setState 호출을 건너뛰어 이 문제를 방지한다.
 *
 * [내부 처리 흐름]
 * 1. execute 호출 → loading = true, error = null 초기화
 * 2. apiCallRef.current 실행 → AxiosResponse<ApiResponse<T>> 반환
 * 3. response.data (ApiResponse<T>) 에서 실제 데이터 추출
 * 4. isMountedRef.current 확인 후 setState 실행 (언마운트 시 스킵)
 * 5. 성공 → ApiResponse<T> 반환 (소비자가 .message, .data 등에 접근 가능)
 * 6. 실패 → ApiError 를 error 상태에 저장 후 throw (소비자 catch 에서 처리 가능)
 * 7. finally → loading = false (마운트 상태일 때만)
 *
 * @param apiCall  axiosInstance 기반 API 함수
 * @param options  immediate, initialData, immediateArgs
 * @returns        { data, loading, error, execute, reset }
 *
 * @example 마운트 즉시 자동 호출 (인자 없음)
 * const { data: boards, loading } = useApi(boardApi.getBoards);
 *
 * @example 마운트 시 id 전달이 필요한 경우
 * const { data: user, loading } = useApi(
 * userApi.getUser,
 * { immediateArgs: [userId] }
 * );
 *
 * @example 버튼 등 이벤트에서 수동 호출
 * const { loading, execute: login } = useApi(
 * authApi.login,
 * { immediate: false }
 * );
 * const handleSubmit = async () => {
 * try {
 * await login(formData);
 * navigate('/');
 * } catch (error) {
 * if (error instanceof ApiError) alert(error.message);
 * }
 * };
 */
export function useApi<TData, TArgs extends unknown[] = any[]>(
  apiCall: ApiCallFn<TData, TArgs>,
  options: UseApiOptions<TData, TArgs> = {},
): UseApiReturn<TData, TArgs> {
  const { immediate = true, initialData = null, immediateArgs = [] as unknown as TArgs } = options;

  const [data,    setData]    = useState<TData | null>(initialData);
  const [loading, setLoading] = useState<boolean>(false);
  const [error,   setError]   = useState<ApiError | null>(null);

  /**
   * apiCall 을 ref 로 관리한다.
   * 렌더링마다 인라인 익명 함수가 새로 생성되더라도 ref 로 항상 최신 함수를 참조하되,
   * execute 자체의 참조값은 변하지 않아 안정적이다.
   */
  const apiCallRef = useRef<ApiCallFn<TData, TArgs>>(apiCall);
  useEffect(() => {
    apiCallRef.current = apiCall;
  });

  /**
   * 컴포넌트 마운트 여부를 추적하는 플래그.
   * 언마운트 이후 뒤늦게 도착한 응답이 setState 를 호출하는 것을 방지한다.
   * useEffect cleanup 에서 false 로 설정하여 언마운트 시점을 감지한다.
   */
  const isMountedRef = useRef(false);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * API 를 실제로 호출하는 함수.
   *
   * [의존성 배열이 빈 이유]
   * apiCallRef 를 통해 항상 최신 apiCall 을 참조하므로 apiCall 을 의존성에 넣을 필요가 없다.
   * 빈 의존성 배열로 execute 참조를 최초 1회 고정하여 불필요한 재생성을 막는다.
   */
  const execute = useCallback(
    async (...args: TArgs): Promise<ApiResponse<TData>> => {
      setLoading(true);
      setError(null);
      try {
        const response    = await apiCallRef.current(...args);
        const apiResponse = response.data;         // AxiosResponse → ApiResponse<T> 추출

        /**
         * 응답 도착 시점에 컴포넌트가 언마운트되어 있으면 setState 를 건너뛴다.
         * 느린 네트워크 환경에서 페이지 이탈 후 뒤늦게 도착하는 응답을 안전하게 처리한다.
         */
        if (isMountedRef.current) {
          setData(apiResponse.data ?? null);
        }
        return apiResponse;
      } catch (err) {
        /**
         * axios.ts 인터셉터가 대부분 ApiError 로 변환하지만,
         * 예기치 못한 에러(네트워크 단절 등)는 일반 Error 로 들어올 수 있어 분기 처리한다.
         */
        const apiError =
          err instanceof ApiError
            ? err
            : new ApiError((err as Error).message, 'UNKNOWN', 0);
        if (isMountedRef.current) {
          setError(apiError);
        }
        throw apiError;
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [], // execute 참조 고정 — apiCallRef 를 통해 항상 최신 함수 참조
  );

  /**
   * immediate: true 이면 마운트 시 한 번 자동 호출한다.
   * immediateArgs 에 고정값(id, 초기 page 등)을 넘겨 필수 인자가 있는 API 도 처리 가능하다.
   *
   * [상태 값을 immediateArgs 에 넣지 말 것]
   * 마운트 시 단 1회만 호출되므로 상태 변화를 반영하지 않는다.
   * 상태 기반 재호출이 필요하면 immediate: false + 컴포넌트 단 useEffect 를 사용한다.
   */
  useEffect(() => {
    if (!immediate) return;
    const timer = setTimeout(() => {
      void execute(...immediateArgs);
    }, 0);
    return () => clearTimeout(timer);
  }, []);// eslint-disable-line react-hooks/exhaustive-deps

  /**
   * data, error, loading 을 초기 상태로 되돌린다.
   * 폼 초기화, 모달 닫기 등 상태를 리셋할 때 사용한다.
   */
  const reset = useCallback(() => {
    setData(initialData);
    setError(null);
    setLoading(false);
  }, [initialData]);

  return { data, loading, error, execute, reset };
}

// ── useApiList ────────────────────────────────────────────────────

/**
 * 페이지네이션이 포함된 목록 조회 전용 커스텀 훅.
 * useApi 와 동일하게 동작하지만 pagination 상태를 추가로 관리한다.
 *
 * [useApi 와의 차이]
 * - data 타입이 T[] (배열)
 * - pagination 상태 추가 (totalPages, page, totalElements 등)
 * - data 초기값이 null — 로딩 전(null)과 데이터 없음([])을 구분 가능
 *
 * [페이지네이션 / 검색 필터 구현 예시]
 * const { data, execute } = useApiList(boardApi.getBoards, { immediate: false });
 * useEffect(() => {
 * void execute({ page, filter });
 * }, [page, filter, execute]); // execute 참조가 고정되어 있으므로 안전하다
 *
 * @param apiCall  목록을 반환하는 API 함수
 * @param options  immediate, immediateArgs
 * @returns        { data, pagination, loading, error, execute, reset }
 *
 * @example
 * const { data: boards, pagination, loading } = useApiList(
 * boardApi.getBoards,
 * { immediateArgs: [{ page: 0, size: 10 }] }
 * );
 * // pagination?.totalPages, pagination?.page 로 페이지 정보 접근
 * // data === null → 로딩 전 / data === [] → 데이터 없음
 */
export function useApiList<TData, TArgs extends unknown[] = any[]>(
  apiCall: ApiCallFn<TData[], TArgs>,
  options: UseApiOptions<TData[], TArgs> = {},
): UseApiListReturn<TData, TArgs> {
  const { immediate = true, immediateArgs = [] as unknown as TArgs } = options;

  const [data,       setData]       = useState<TData[] | null>(null);
  const [pagination, setPagination] = useState<PageInfo | null>(null);
  const [loading,    setLoading]    = useState<boolean>(false);
  const [error,      setError]      = useState<ApiError | null>(null);

  /**
   * apiCall 을 ref 로 관리하여 execute 참조를 안정적으로 고정한다.
   * useApi 와 동일한 원칙을 따른다.
   */
  const apiCallRef = useRef<ApiCallFn<TData[], TArgs>>(apiCall);
  useEffect(() => {
    apiCallRef.current = apiCall;
  });

  /**
   * 컴포넌트 마운트 여부를 추적하는 플래그.
   * 언마운트 이후 뒤늦게 도착한 응답의 setState 를 방지한다.
   */
  const isMountedRef = useRef(false);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * 목록 API 를 호출하고 data 와 pagination 을 함께 업데이트한다.
   * response.data (ApiResponse<T[]>) 에서 data, pagination 을 각각 꺼내 저장한다.
   * 언마운트 이후 도착한 응답은 isMountedRef 로 걸러 setState 를 건너뛴다.
   */
  const execute = useCallback(
    async (...args: TArgs): Promise<ApiResponse<TData[]>> => {
      setLoading(true);
      setError(null);
      try {
        const response    = await apiCallRef.current(...args);
        const apiResponse = response.data;
        if (isMountedRef.current) {
          setData(apiResponse.data ?? []);
          setPagination(apiResponse.pagination ?? null);
        }
        return apiResponse;
      } catch (err) {
        const apiError =
          err instanceof ApiError
            ? err
            : new ApiError((err as Error).message, 'UNKNOWN', 0);
        if (isMountedRef.current) {
          setError(apiError);
        }
        throw apiError;
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (!immediate) return;
    const timer = setTimeout(() => {
      void execute(...immediateArgs);
    }, 0);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * data, pagination, error, loading 을 초기 상태로 되돌린다.
   * 검색 조건 초기화, 페이지 변경 등에서 상태를 리셋할 때 사용한다.
   */
  const reset = useCallback(() => {
    setData(null);
    setPagination(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, pagination, loading, error, execute, reset };
}