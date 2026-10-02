import { messages } from '../lib/messages';
import { z } from 'zod';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly requestId?: string,
    public readonly code?: string,
    public readonly fields?: Record<string, string[]>,
  ) {
    super(message);
  }
}

const tokenSchema = z.object({
  accessToken: z.string(),
  accessTokenExpiresAtUtc: z.string(),
  refreshToken: z.string(),
  refreshTokenExpiresAtUtc: z.string(),
});
export type Tokens = z.infer<typeof tokenSchema>;
const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const storageKey = 'commerce.refresh';
let accessToken: string | null = null;
let refreshFlight: Promise<void> | null = null;
let generation = 0;

export function hasSession() {
  return accessToken !== null || sessionStorage.getItem(storageKey) !== null;
}
export function sessionGeneration() {
  return generation;
}
export function saveTokens(value: unknown, newSession = false) {
  const tokens = tokenSchema.parse(value);
  if (newSession) generation++;
  accessToken = tokens.accessToken;
  // Only the opaque rotating credential survives a tab reload. Nothing is persisted to localStorage.
  sessionStorage.setItem(storageKey, tokens.refreshToken);
}
export function clearSession(reason: 'logout' | 'expired' = 'logout') {
  generation++;
  accessToken = null;
  sessionStorage.removeItem(storageKey);
  window.dispatchEvent(new CustomEvent('commerce:session-ended', { detail: { reason } }));
}

async function rotate(): Promise<void> {
  if (!refreshFlight) {
    const before = generation;
    refreshFlight = (async () => {
      const refreshToken = sessionStorage.getItem(storageKey);
      if (!refreshToken) throw new ApiError(messages.loginRequired, 401);
      const response = await fetch(baseUrl + '/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!response.ok) {
        if (response.status === 401 && generation === before) clearSession('expired');
        throw new ApiError(
          response.status === 401 ? messages.sessionExpired : messages.renewalUnavailable,
          response.status,
        );
      }
      const tokens: unknown = await response.json();
      // A refresh finishing after logout must never resurrect a closed session.
      if (generation !== before) throw new ApiError(messages.sessionEnded, 401);
      saveTokens(tokens);
    })().finally(() => {
      refreshFlight = null;
    });
  }
  return refreshFlight;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
  headers?: Record<string, string>;
  authenticated?: boolean;
}
const problemSchema = z.object({
  title: z.string().optional(),
  detail: z.string().optional(),
  errors: z.record(z.string(), z.array(z.string())).optional(),
});

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const authenticated = options.authenticated ?? true;
  const requestGeneration = generation;
  if (authenticated && !accessToken && hasSession()) await rotate();
  const requestId = crypto.randomUUID();
  const send = () => {
    // Check before sending too: an old request must not execute a mutation under a newly signed-in user.
    if (authenticated && generation !== requestGeneration) throw new ApiError(messages.sessionEnded, 401);
    return fetch(baseUrl + path, {
      method: options.method ?? 'GET',
      signal: options.signal,
      headers: {
        Accept: 'application/json',
        'X-Correlation-Id': requestId,
        ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(authenticated && accessToken ? { Authorization: 'Bearer ' + accessToken } : {}),
        ...options.headers,
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  };
  let response: Response;
  try {
    const sentToken = accessToken;
    response = await send();
    if (response.status === 401 && authenticated && hasSession()) {
      // A late 401 from an older credential reuses an already rotated token rather than rotating again.
      if (sentToken === accessToken) await rotate();
      // The first response was rejected at authentication; repeat once with the replacement credential.
      response = await send();
    }
  } catch (error) {
    if (error instanceof ApiError || (error instanceof DOMException && error.name === 'AbortError'))
      throw error;
    throw new ApiError(messages.connectionUnavailable, 0, requestId);
  }
  if (authenticated && generation !== requestGeneration) throw new ApiError(messages.sessionEnded, 401);
  if (!response.ok) {
    if (response.status === 401 && authenticated) clearSession('expired');
    const parsed = problemSchema.safeParse(await response.json().catch(() => null));
    const statusMessages: Record<number, string> = {
      400: messages.validationRejected,
      401: messages.loginRequired,
      403: messages.permissionDenied,
      404: messages.recordNotFound,
      409: messages.conflict,
      429: messages.rateLimited,
    };
    throw new ApiError(
      response.status >= 500
        ? messages.serviceUnavailable
        : parsed.data?.detail || statusMessages[response.status] || messages.requestFailed,
      response.status,
      response.headers.get('X-Correlation-Id') || requestId,
      parsed.data?.title,
      parsed.data?.errors,
    );
  }
  if (response.status === 204) return undefined as T;
  const result: unknown = await (response.headers.get('Content-Type')?.includes('json')
    ? response.json()
    : response.text());
  if (authenticated && generation !== requestGeneration) throw new ApiError(messages.sessionEnded, 401);
  return result as T;
}

export function queryString(values: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values))
    if (value !== undefined && value !== '') params.set(key, String(value));
  return params.toString();
}
export function retryQuery(count: number, error: Error) {
  return count < 2 && error instanceof ApiError && (error.status === 0 || error.status >= 500);
}
export async function logout() {
  const refreshToken = sessionStorage.getItem(storageKey);
  try {
    if (refreshToken)
      await api<void>('/api/auth/logout', { method: 'POST', body: { refreshToken }, authenticated: false });
  } finally {
    clearSession();
  }
}
