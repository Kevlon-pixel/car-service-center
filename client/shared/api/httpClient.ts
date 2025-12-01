type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestConfig extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

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
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
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
    throw new Error(
      Array.isArray(message) ? message.join(', ') : String(message),
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
