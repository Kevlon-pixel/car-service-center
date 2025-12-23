import { ApiError, RequestConfig, httpClient } from '@shared/api';
import { AUTH_ENDPOINTS } from '@shared/config/api';

const ACCESS_TOKEN_KEY = 'car-service-access-token';
export const AUTH_EVENT = 'car-service-auth-changed';

function emitAuthChange(token: string | null) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(AUTH_EVENT, {
        detail: { token },
      }),
    );
  }
}

let cachedAccessToken: string | null =
  typeof window !== 'undefined'
    ? window.localStorage.getItem(ACCESS_TOKEN_KEY)
    : null;

export const tokenStorage = {
  get: () => cachedAccessToken,
  set: (token: string | null) => {
    cachedAccessToken = token;
    if (typeof window !== 'undefined') {
      if (token) {
        window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
      } else {
        window.localStorage.removeItem(ACCESS_TOKEN_KEY);
      }
    }
    emitAuthChange(token);
  },
  clear: () => {
    cachedAccessToken = null;
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    }
    emitAuthChange(null);
  },
};

async function refreshAccessToken(): Promise<string | null> {
  try {
    const { accessToken } = await httpClient<{ accessToken: string }>(
      AUTH_ENDPOINTS.refresh,
      { method: 'POST' },
    );
    tokenStorage.set(accessToken);
    return accessToken;
  } catch {
    tokenStorage.clear();
    return null;
  }
}

interface AuthRequestOptions {
  useAuth?: boolean;
}

export async function apiRequest<T>(
  path: string,
  config: RequestConfig = {},
  options: AuthRequestOptions = {},
): Promise<T> {
  const { useAuth = true } = options;
  const baseHeaders = config.headers;
  const headers: Record<string, string> =
    baseHeaders instanceof Headers
      ? Object.fromEntries(baseHeaders.entries())
      : Array.isArray(baseHeaders)
        ? Object.fromEntries(baseHeaders)
        : { ...(baseHeaders ?? {}) };

  if (useAuth && tokenStorage.get()) {
    headers.Authorization = `Bearer ${tokenStorage.get()}`;
  }

  try {
    return await httpClient<T>(path, { ...config, headers });
  } catch (error) {
    if (useAuth && error instanceof ApiError && error.status === 401) {
      const newToken = await refreshAccessToken();
      if (!newToken) {
        throw error;
      }
      return httpClient<T>(path, {
        ...config,
        headers: { ...headers, Authorization: `Bearer ${newToken}` },
      });
    }
    throw error;
  }
}

export async function safeRefreshSession() {
  return refreshAccessToken();
}
