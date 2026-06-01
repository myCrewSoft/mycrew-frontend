export interface LoginRequest {
  empId: number;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  empId: number;
  authVersion: number;
  firstLoginRequired: boolean;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken?: string;
  empId?: number;
  authVersion?: number;
}
