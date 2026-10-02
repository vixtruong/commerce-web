import { afterAll, beforeAll, afterEach, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { api, clearSession, saveTokens, retryQuery, ApiError } from './client';
const tokens = {
  accessToken: 'expired',
  accessTokenExpiresAtUtc: '2026-01-01',
  refreshToken: 'opaque',
  refreshTokenExpiresAtUtc: '2026-12-01',
};
const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
afterEach(() => {
  server.resetHandlers();
  clearSession();
});
describe('Gateway client', () => {
  it('rotates once for concurrent unauthorized requests', async () => {
    let refreshes = 0;
    saveTokens(tokens);
    server.use(
      http.get('*/api/test', ({ request }) =>
        request.headers.get('Authorization') === 'Bearer renewed'
          ? HttpResponse.json({ ok: true })
          : new HttpResponse(null, { status: 401 }),
      ),
      http.post('*/api/auth/refresh', async () => {
        refreshes++;
        await new Promise((resolve) => setTimeout(resolve, 30));
        return HttpResponse.json({ ...tokens, accessToken: 'renewed' });
      }),
    );
    const result = await Promise.all([
      api<{ ok: boolean }>('/api/test'),
      api<{ ok: boolean }>('/api/test'),
      api<{ ok: boolean }>('/api/test'),
    ]);
    expect(refreshes).toBe(1);
    expect(result.every((r) => r.ok)).toBe(true);
  });
  it('does not retry a failed checkout mutation and captures correlation references', async () => {
    let calls = 0;
    server.use(
      http.post('*/api/orders/checkout', () => {
        calls++;
        return HttpResponse.json(
          { title: 'Ordering.RequestInProgress' },
          { status: 409, headers: { 'X-Correlation-Id': 'diagnostic-id' } },
        );
      }),
    );
    const error = await api('/api/orders/checkout', {
      method: 'POST',
      body: {},
      headers: { 'Idempotency-Key': 'stable-key' },
    }).catch((e: unknown) => e);
    expect(calls).toBe(1);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).requestId).toBe('diagnostic-id');
  });
  it('retries only transient query failures', () => {
    for (const status of [400, 401, 403, 404, 409, 429])
      expect(retryQuery(0, new ApiError('test', status))).toBe(false);
    expect(retryQuery(0, new ApiError('test', 503))).toBe(true);
    expect(retryQuery(2, new ApiError('test', 503))).toBe(false);
  });
  it('does not resurrect a session when refresh finishes after logout', async () => {
    saveTokens(tokens);
    server.use(
      http.get('*/api/test', () => new HttpResponse(null, { status: 401 })),
      http.post('*/api/auth/refresh', async () => {
        await new Promise((resolve) => setTimeout(resolve, 30));
        return HttpResponse.json({ ...tokens, accessToken: 'renewed' });
      }),
    );
    const request = api('/api/test');
    await new Promise((resolve) => setTimeout(resolve, 10));
    clearSession();
    await expect(request).rejects.toMatchObject({ status: 401 });
    expect(sessionStorage.getItem('commerce.refresh')).toBeNull();
  });
  it('does not resend an old mutation using a newly signed-in account', async () => {
    saveTokens(tokens, true);
    let calls = 0;
    let release: () => void = () => undefined;
    let started: () => void = () => undefined;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    const observed = new Promise<void>((resolve) => {
      started = resolve;
    });
    server.use(
      http.post('*/api/test', async () => {
        calls++;
        started();
        await pending;
        return new HttpResponse(null, { status: 401 });
      }),
    );
    const request = api('/api/test', { method: 'POST', body: { quantity: 1 } });
    await observed;
    clearSession();
    saveTokens({ ...tokens, accessToken: 'different-user' }, true);
    release();
    await expect(request).rejects.toMatchObject({ status: 401 });
    expect(calls).toBe(1);
  });
});
