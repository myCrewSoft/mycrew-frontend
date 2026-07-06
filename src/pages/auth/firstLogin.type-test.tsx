import type { ComponentProps } from 'react';
import { authApi } from '../../api/authApi';
import FirstLoginPage from './FirstLoginPage';
import type {
  FirstLoginRequest,
  GoogleAuthorizeResponse,
} from '../../types/auth';

declare const firstLoginRequest: FirstLoginRequest;
declare const googleAuthorize: GoogleAuthorizeResponse;

export const firstLoginPageProps: ComponentProps<typeof FirstLoginPage> = {};

export const firstLoginRequestContract = {
  emailAddr: firstLoginRequest.emailAddr,
  newPassword: firstLoginRequest.newPassword,
};

export const googleAuthorizeContract = {
  authorizationUrl: googleAuthorize.authorizationUrl,
};

export const googleAuthorizeRequest = authApi.getGoogleAuthorizeUrl();
export const firstLoginCompleteRequest =
  authApi.completeFirstLogin(firstLoginRequest);
