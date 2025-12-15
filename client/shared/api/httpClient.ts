import { API_URL } from '@shared/config/api';

export interface RequestConfig extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export const API_BASE = API_URL;

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

function buildUrl(path: string, params?: RequestConfig['params']) {
  const url = new URL(
    path.replace(/^\//, ''),
    API_BASE.endsWith('/') ? API_BASE : `${API_BASE}/`,
  );

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
}

export async function httpClient<T>(
  path: string,
  { params, headers, method = 'GET', ...init }: RequestConfig = {},
): Promise<T> {
  const url = buildUrl(path, params);
  const finalHeaders = new Headers(headers ?? {});

  // Only set JSON content type when we actually send a body
  if (init.body !== undefined && !finalHeaders.has('Content-Type')) {
    finalHeaders.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    method,
    headers: finalHeaders,
    credentials: init.credentials ?? 'include',
    ...init,
  });

  const contentType = response.headers.get('content-type');
  const data =
    contentType && contentType.includes('application/json')
      ? await response.json()
      : await response.text();

  if (!response.ok) {
    const message =
      typeof data === 'string'
        ? data
        : ((data as Record<string, unknown>)?.message ?? 'Unexpected error');
    throw new ApiError(
      Array.isArray(message) ? message.join(', ') : String(message),
      response.status,
      data,
    );
  }

  return data as T;
}

export const api = {
  get: <T>(path: string, config?: Omit<RequestConfig, 'method'>) =>
    httpClient<T>(path, { ...config, method: 'GET' }),
  post: <T>(
    path: string,
    body?: unknown,
    config?: Omit<RequestConfig, 'method'>,
  ) =>
    httpClient<T>(path, {
      ...config,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: <T>(
    path: string,
    body?: unknown,
    config?: Omit<RequestConfig, 'method'>,
  ) =>
    httpClient<T>(path, {
      ...config,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(
    path: string,
    body?: unknown,
    config?: Omit<RequestConfig, 'method'>,
  ) =>
    httpClient<T>(path, {
      ...config,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string, config?: Omit<RequestConfig, 'method'>) =>
    httpClient<T>(path, { ...config, method: 'DELETE' }),
};
