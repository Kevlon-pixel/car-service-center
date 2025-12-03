import { apiRequest, safeRefreshSession, tokenStorage } from '@features/auth/lib/session';
import { AUTH_ENDPOINTS, USER_ENDPOINTS } from '@shared/config/api';
import { ApiError, httpClient } from '@shared/api';

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  surname: string;
  phone: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
}

export interface UserProfile {
  id: string;
  email: string;
  role: 'USER' | 'WORKER' | 'ADMIN';
  name: string;
  surname: string;
  phone: string;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function registerUser(payload: RegisterPayload) {
  return httpClient<{ message: string }>(AUTH_ENDPOINTS.register, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function loginUser(payload: LoginPayload) {
  const result = await httpClient<AuthResponse>(AUTH_ENDPOINTS.login, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  tokenStorage.set(result.accessToken);
  return result;
}

export async function verifyEmail(token: string) {
  const result = await httpClient<AuthResponse>(AUTH_ENDPOINTS.verify, {
    method: 'POST',
    body: JSON.stringify({ emailToken: token }),
  });
  tokenStorage.set(result.accessToken);
  return result;
}

export async function logoutUser() {
  try {
    const accessToken = tokenStorage.get();
    await httpClient(AUTH_ENDPOINTS.logout, {
      method: 'POST',
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });
  } catch (err) {
    if (!(err instanceof ApiError) || (err.status !== 401 && err.status !== 403)) {
      throw err;
    }
  } finally {
    tokenStorage.clear();
  }
}

export async function fetchProfile() {
  return apiRequest<UserProfile>(USER_ENDPOINTS.me);
}

export async function restoreSession() {
  if (tokenStorage.get()) {
    return tokenStorage.get();
  }
  return safeRefreshSession();
}
