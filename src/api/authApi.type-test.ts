import { authApi, type LoginRequest, type LoginResponse } from './authApi';

const request: LoginRequest = {
  empId: 1234,
  password: '1234',
};

async function assertLoginContract() {
  const response = await authApi.login(request);
  const data: LoginResponse | undefined = response.data.data;

  if (!data) return;

  const accessToken: string = data.accessToken;
  const refreshToken: string = data.refreshToken;
  const empId: number = data.empId;
  const authVersion: number = data.authVersion;
  const firstLoginRequired: boolean = data.firstLoginRequired;

  void accessToken;
  void refreshToken;
  void empId;
  void authVersion;
  void firstLoginRequired;
}

void assertLoginContract;
