import Constants from 'expo-constants';
import { ApiError, apiRequest, getErrorMessage, toApiError } from '@/scripts/services/apiClient';
import { fetchCall, installFetchMock, mockResponse } from '@/test-utils/fetchMock';

let fetchMock: jest.Mock;

beforeEach(() => {
  fetchMock = installFetchMock();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe('apiRequest: success', () => {
  it('GETs from BASE_URL + path and parses JSON', async () => {
    fetchMock.mockResolvedValue(mockResponse(200, [{ id: 'h1' }]));

    await expect(apiRequest('/api/habits/me', { token: 'tok' })).resolves.toEqual([{ id: 'h1' }]);

    const { url, init } = fetchCall(fetchMock);
    expect(url).toBe('http://api.test/api/habits/me');
    expect(init.method).toBe('GET');
    expect(init.headers).toEqual({ 'Content-Type': 'application/json', Authorization: 'Bearer tok' });
    expect(init.body).toBeUndefined();
  });

  it('sends a JSON body', async () => {
    fetchMock.mockResolvedValue(mockResponse(200, { ok: true }));

    await apiRequest('/x', { method: 'POST', body: { a: 1 } });

    expect(fetchCall(fetchMock).body).toEqual({ a: 1 });
  });

  it('omits the Authorization header without a token', async () => {
    fetchMock.mockResolvedValue(mockResponse(200, {}));

    await apiRequest('/api/users/login', { method: 'POST', body: {} });

    expect(fetchCall(fetchMock).init.headers).not.toHaveProperty('Authorization');
  });

  it('returns undefined for an empty (e.g. 204) response', async () => {
    fetchMock.mockResolvedValue(mockResponse(204));

    await expect(apiRequest('/x', { method: 'DELETE' })).resolves.toBeUndefined();
  });
});

describe('apiRequest: failures', () => {
  it('reports an unreachable server as an offline network error', async () => {
    fetchMock.mockRejectedValue(new TypeError('Network request failed'));

    const error = await apiRequest('/x').catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.kind).toBe('network');
    expect(error.isOffline).toBe(true);
    expect(error.message).toMatch(/can't reach/i);
  });

  it('times out a request that never answers', async () => {
    jest.useFakeTimers();
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal!.addEventListener('abort', () => reject(new Error('Aborted')));
        }),
    );

    const pending = apiRequest('/slow', { timeoutMs: 1000 }).catch((e) => e);
    jest.advanceTimersByTime(1000);
    const error = await pending;

    expect(error.kind).toBe('timeout');
    expect(error.isOffline).toBe(true);
  });

  it.each([
    [401, 'unauthorized'],
    [403, 'unauthorized'],
    [404, 'notFound'],
    [409, 'badRequest'],
    [500, 'server'],
    [503, 'server'],
  ])('maps HTTP %i to %s', async (status, kind) => {
    fetchMock.mockResolvedValue(mockResponse(status, 'oops'));

    const error = await apiRequest('/x').catch((e) => e);

    expect(error.kind).toBe(kind);
    expect(error.status).toBe(status);
    expect(error.isOffline).toBe(false);
  });

  it("shows the server's reason for a 400", async () => {
    fetchMock.mockResolvedValue(mockResponse(400, 'An account with this email already exists.'));

    const error = await apiRequest('/api/users/register', { method: 'POST' }).catch((e) => e);

    expect(error.message).toBe('An account with this email already exists.');
  });

  it("doesn't show a long or HTML 400 body to the user", async () => {
    fetchMock.mockResolvedValue(mockResponse(400, '<html>' + 'x'.repeat(500) + '</html>'));

    const error = await apiRequest('/x').catch((e) => e);

    expect(error.message).not.toContain('<html>');
    expect(error.detail).toContain('<html>');
  });

  it("never shows a 500's body (could be a stack trace), but keeps it for logging", async () => {
    fetchMock.mockResolvedValue(mockResponse(500, 'NullPointerException at ...'));

    const error = await apiRequest('/x').catch((e) => e);

    expect(error.message).not.toContain('NullPointerException');
    expect(error.detail).toBe('NullPointerException at ...');
  });

  it('treats an unreadable success body as a server error', async () => {
    fetchMock.mockResolvedValue(mockResponse(200, 'not json'));

    await expect(apiRequest('/x')).rejects.toMatchObject({ kind: 'server' });
  });

  it('fails fast without calling fetch when BASE_URL is missing', async () => {
    const extra = Constants.expoConfig!.extra!;
    const original = extra.BASE_URL;
    extra.BASE_URL = undefined;
    try {
      await expect(apiRequest('/x')).rejects.toMatchObject({ kind: 'config' });
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      extra.BASE_URL = original;
    }
  });
});

describe('toApiError / getErrorMessage', () => {
  it('passes ApiErrors through unchanged', () => {
    const e = new ApiError('notFound');
    expect(toApiError(e)).toBe(e);
  });

  it('wraps anything else in a generic, user-safe error', () => {
    const wrapped = toApiError(new Error('undefined is not a function'));
    expect(wrapped.kind).toBe('unknown');
    expect(wrapped.message).toBe('Something went wrong. Please try again.');
    expect(wrapped.detail).toBe('undefined is not a function');
    expect(getErrorMessage('boom')).toBe('Something went wrong. Please try again.');
  });
});
