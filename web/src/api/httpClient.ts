/**
 * WebApiClient transport (Q2=A axios). Base URL from `VITE_API_BASE_URL` (default "/api" via the
 * dev proxy). A request interceptor attaches the bearer token (BR-W3). A response interceptor maps
 * every failure to a typed `ApiError`; on `UNAUTHORIZED` (401) for a protected call it clears the
 * session and redirects to login (BR-W2/EH-W3). A login 401 (`INVALID_CREDENTIALS`) is NOT treated
 * as session expiry (EH-W2) — the login form handles it inline.
 */
import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { ErrorCode } from '@smartstock/shared';
import { clearSession, readToken } from '../auth/sessionStorage';
import { ApiError, apiErrorFromResponse, networkApiError } from './ApiError';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

/** Query string appended to the login redirect so the page can show a "session ended" notice. */
export const SESSION_EXPIRED_FLAG = 'sessionExpired';

export const httpClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

httpClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = readToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const apiError = toApiError(error);

    // Session expiry (EH-W3): a 401 on any protected call. Login's own 401 is INVALID_CREDENTIALS
    // and is excluded so the login form can show an inline credential error (EH-W2).
    if (apiError.httpStatus === 401 && apiError.code === ErrorCode.UNAUTHORIZED) {
      clearSession();
      redirectToLogin();
    }

    return Promise.reject(apiError);
  },
);

function toApiError(error: unknown): ApiError {
  if (ApiError.isApiError(error)) {
    return error;
  }
  if (error instanceof AxiosError) {
    if (error.response) {
      return apiErrorFromResponse(error.response.status, error.response.data);
    }
    return networkApiError();
  }
  return networkApiError();
}

function redirectToLogin(): void {
  if (typeof window === 'undefined') {
    return;
  }
  const { pathname } = window.location;
  if (pathname === '/login') {
    return;
  }
  window.location.assign(`/login?${SESSION_EXPIRED_FLAG}=1`);
}
