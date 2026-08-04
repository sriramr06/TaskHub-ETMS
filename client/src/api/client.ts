import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api',
  withCredentials: true,
});

/**
 * Native inputs/selects always submit `""` for an untouched optional field,
 * but the backend's Zod schemas use `.min(1).optional()`, which rejects `""`
 * (only `undefined` satisfies "optional"). Strip empty strings from outgoing
 * JSON bodies here instead of patching every form.
 */
const stripEmptyStrings = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stripEmptyStrings);
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (val === '') continue;
      result[key] = stripEmptyStrings(val);
    }
    return result;
  }
  return value;
};

api.interceptors.request.use((config) => {
  if (config.data && !(config.data instanceof FormData)) {
    config.data = stripEmptyStrings(config.data);
  }
  return config;
});

let refreshPromise: Promise<void> | null = null;

const refreshAccessToken = async (): Promise<void> => {
  if (!refreshPromise) {
    refreshPromise = api
      .post('/auth/refresh-token')
      .then(() => undefined)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    const status = error.response?.status;
    const url = config?.url ?? '';

    const isAuthRoute = url.includes('/auth/login') || url.includes('/auth/refresh-token');

    if (status === 401 && config && !config._retried && !isAuthRoute) {
      config._retried = true;
      try {
        await refreshAccessToken();
        return api(config);
      } catch {
        window.dispatchEvent(new CustomEvent('auth:logout'));
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

export interface ApiErrorShape {
  success: false;
  message: string;
}

export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorShape | undefined;
    return data?.message ?? error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong.';
};
