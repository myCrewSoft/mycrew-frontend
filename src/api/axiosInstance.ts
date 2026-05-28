import axios from 'axios';
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// ── 타입 확장 ─────────────────────────────────────────────────────
/**
 * Axios 의 InternalAxiosRequestConfig 에 _retry 속성을 추가한다.
 * 기본 타입에 존재하지 않으므로 Module Augmentation 으로 확장한다.
 * _retry 는 401 발생 시 토큰 재발급 후 재시도를 한 번만 허용하기 위한 플래그다.
 */
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

// ── 타입 정의 ────────────────────────────────────────────────────

/** 목록 조회 응답에 포함되는 페이지네이션 정보 타입 */
export interface PageInfo {
  page: number;          // 현재 페이지 번호 (0-based)
  size: number;          // 페이지당 항목 수
  totalElements: number; // 전체 항목 수
  totalPages: number;    // 전체 페이지 수
  first: boolean;        // 첫 페이지 여부
  last: boolean;         // 마지막 페이지 여부
}

/**
 * 백엔드 ApiResponse 와 1:1 매핑되는 타입.
 * success 가 false 일 때도 message, errorCode 는 항상 포함된다.
 * data, pagination 은 성공 응답에만 포함되므로 optional 로 선언한다.
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errorCode?: string;
  pagination?: PageInfo;
}

/**
 * API 호출 실패 시 throw 되는 커스텀 에러 클래스.
 * GlobalExceptionHandler 가 반환하는 errorCode 와 HTTP 상태코드를 함께 담는다.
 * catch 블록에서 instanceof ApiError 로 구분하여 처리한다.
 */
export class ApiError extends Error {
  public readonly errorCode: string;
  public readonly httpStatus: number;

  constructor(message: string, errorCode: string, httpStatus: number) {
    super(message);
    this.name       = 'ApiError';
    this.errorCode  = errorCode;
    this.httpStatus = httpStatus;
  }
}

// ── Axios 인스턴스 ────────────────────────────────────────────────

/**
 * 전역 Axios 인스턴스.
 * 모든 API 요청에 사용하며, 요청/응답 인터셉터가 적용된다.
 * axios 를 직접 import 하지 말고 이 인스턴스만 사용한다.
 */
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Refresh Token 전용 순수 인스턴스.
 * 인터셉터가 적용되지 않은 별도 인스턴스를 사용한다.
 *
 * [이유]
 * axiosInstance 로 재발급 요청을 보내면, 재발급 요청마저 401 을 받을 때
 * 동일한 인터셉터에 걸려 대기열에 쌓이거나 교착 상태(Lock)가 발생할 수 있다.
 * 별도 인스턴스를 사용하면 인터셉터 없이 순수하게 요청하므로 이 문제를 방지한다.
 */
const refreshInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

// ── 요청 인터셉터 ─────────────────────────────────────────────────

/**
 * 모든 요청 전에 실행된다.
 * localStorage 에서 Access Token 을 꺼내 Authorization 헤더에 자동으로 첨부한다.
 * 토큰이 없는 요청(로그인, 회원가입 등)은 헤더 없이 그대로 전송된다.
 */
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

// ── 토큰 자동 갱신을 위한 상태 변수 ──────────────────────────────

/**
 * 토큰 갱신이 진행 중인지 여부.
 * 여러 요청이 동시에 401 을 받았을 때 갱신 요청을 한 번만 보내기 위한 플래그다.
 */
let isRefreshing = false;

/**
 * 토큰 갱신 중 들어온 요청들의 대기열.
 * 갱신 완료 후 새 토큰으로 일괄 재시도하거나, 실패 시 일괄 reject 한다.
 */
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

/**
 * 대기열에 있는 요청들을 일괄 처리한다.
 * - 갱신 성공: 새 토큰을 전달하여 각 요청을 재시도하게 한다.
 * - 갱신 실패: 에러를 전달하여 각 요청을 reject 한다.
 */
const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) =>
    token ? resolve(token) : reject(error),
  );
  failedQueue = [];
};

// ── 응답 인터셉터 ─────────────────────────────────────────────────

axiosInstance.interceptors.response.use(

  /**
   * HTTP 2xx 응답을 처리한다.
   * 백엔드가 success: false 를 2xx 로 내려보낸 경우에도 ApiError 로 변환한다.
   * success: true 이면 response 전체를 그대로 반환한다. (Axios 규격 유지)
   */
  (response: AxiosResponse<ApiResponse>) => {
    if (!response.data?.success) {
      return Promise.reject(
        new ApiError(
          response.data?.message ?? '요청에 실패했습니다.',
          response.data?.errorCode ?? 'UNKNOWN',
          response.status,
        ),
      );
    }
    return response;
  },

  /**
   * HTTP 4xx, 5xx 응답 및 네트워크 오류를 처리한다.
   *
   * [401 처리 흐름]
   * 1. Access Token 만료 → Refresh Token 으로 새 토큰 재발급 시도
   * 2. 재발급 성공 → 새 토큰 저장 + AuthContext 동기화 + 실패한 원래 요청 재시도
   * 3. 재발급 실패 → 로그아웃 처리 후 로그인 페이지 이동
   *
   * [동시 401 처리]
   * 여러 요청이 동시에 401 을 받으면 isRefreshing 플래그로 재발급을 한 번만 수행하고,
   * 나머지 요청은 failedQueue 에 넣어 재발급 완료 후 일괄 재시도한다.
   */
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url ?? '';
    const isAuthRequest =
      requestUrl.includes('/api/v1/auth/login') ||
      requestUrl.includes('/api/v1/auth/refresh');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {

      /**
       * 이미 갱신 중이면 대기열에 추가하고 갱신 완료를 기다린다.
       * .catch 를 붙여 갱신 실패 시 에러가 명확히 아래로 전파되도록 한다.
       */
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');

        /**
         * refreshInstance(인터셉터 없는 순수 인스턴스) 로 재발급 요청.
         * axiosInstance 를 사용하면 이 요청이 401 을 받을 때
         * 동일 인터셉터에 걸려 교착 상태가 발생할 수 있다.
         */
        const response = await refreshInstance.post<ApiResponse<{ accessToken: string }>>(
          '/api/v1/auth/refresh',
          { refreshToken },
        );

        /**
         * 옵셔널 체이닝으로 accessToken 을 안전하게 꺼낸다.
         * 백엔드 장애로 data 가 없을 경우 undefined 가 되어
         * 아래 if 문에서 catch 블록으로 흘러가 로그아웃 처리된다.
         */
        const accessToken = response.data.data?.accessToken;

        if (!accessToken) {
          throw new Error('재발급된 Access Token 이 없습니다.');
        }

        localStorage.setItem('accessToken', accessToken);
        axiosInstance.defaults.headers.Authorization = `Bearer ${accessToken}`;

        /**
         * AuthContext 에 토큰 갱신 완료를 알린다.
         * 이벤트 방식을 사용하면 axios.ts 가 AuthContext 를 직접 import 하지 않아도 되어
         * 순환 의존성(Circular Dependency) 을 방지한다.
         * AuthProvider 가 이 이벤트를 수신하여 auth 상태를 재계산한다.
         */
        window.dispatchEvent(new Event('token-refreshed'));

        processQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axiosInstance(originalRequest);

      } catch (refreshError) {
        /**
         * 재발급 실패 처리.
         * 대기 중인 요청들에 에러를 전달하고, 토큰을 제거 후 로그인 페이지로 이동한다.
         * AuthContext 의 clearAuth 가 localStorage 를 제거하지만,
         * Context 에 접근할 수 없으므로 여기서도 직접 제거한다.
         */
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login?expired=true';
        return Promise.reject(refreshError);

      } finally {
        isRefreshing = false;
      }
    }

    /**
     * 네트워크 오류 (서버에서 응답이 없는 경우).
     * error.response 가 없으면 서버 자체에 연결하지 못한 것이다.
     */
    if (!error.response) {
      return Promise.reject(
        new ApiError('서버에 연결할 수 없습니다.', 'NETWORK_ERROR', 0),
      );
    }

    /**
     * 그 외 에러 (403, 404, 500 등).
     * 백엔드 GlobalExceptionHandler 가 내려준 message, errorCode 를 ApiError 로 변환한다.
     */
    const { status, data } = error.response as AxiosResponse<ApiResponse>;
    return Promise.reject(
      new ApiError(
        data?.message ?? '오류가 발생했습니다.',
        data?.errorCode ?? 'UNKNOWN',
        status,
      ),
    );
  },
);

export default axiosInstance;
