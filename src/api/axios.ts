import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

export interface PageInfo {
  page: number; size: number; totalElements: number;
  totalPages: number; first: boolean; last: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errorCode?: string;
  pagination?: PageInfo;
}

export class ApiError extends Error {
  public readonly errorCode: string;
  public readonly httpStatus: number;
  constructor(message: string, errorCode: string, httpStatus: number) {
    super(message);
    this.name = 'ApiError';
    this.errorCode = errorCode;
    this.httpStatus = httpStatus;
  }
}

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

// 요청 인터셉터 - JWT 자동 첨부
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (error: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => token ? resolve(token) : reject(error));
  failedQueue = [];
};

// 응답 인터셉터 - ApiResponse 파싱 + 토큰 자동 갱신
axiosInstance.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const apiResponse = response.data;
    if (!apiResponse.success) {
      return Promise.reject(
        new ApiError(apiResponse.message, apiResponse.errorCode ?? 'UNKNOWN', response.status)
      );
    }
    return apiResponse as unknown as AxiosResponse;
  },
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => { failedQueue.push({ resolve, reject }); })
          .then((token) => { originalRequest.headers.Authorization = `Bearer ${token}`; return axiosInstance(originalRequest); });
      }
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axiosInstance.post('/api/v1/auth/refresh', { refreshToken });
        const { accessToken } = (response as unknown as ApiResponse<{ accessToken: string }>).data!;
        localStorage.setItem('accessToken', accessToken);
        axiosInstance.defaults.headers.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login?expired=true';
        return Promise.reject(refreshError);
      } finally { isRefreshing = false; }
    }
    if (!error.response) return Promise.reject(new ApiError('서버에 연결할 수 없습니다.', 'NETWORK_ERROR', 0));
    const { status, data } = error.response as AxiosResponse<ApiResponse>;
    return Promise.reject(new ApiError(data?.message ?? '오류가 발생했습니다.', data?.errorCode ?? 'UNKNOWN', status));
  }
);

export default axiosInstance;
