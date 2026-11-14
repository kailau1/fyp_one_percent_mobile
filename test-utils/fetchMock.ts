/** The bits of a fetch Response that apiClient reads. */
export function mockResponse(status: number, body?: unknown) {
  const text = body === undefined ? '' : typeof body === 'string' ? body : JSON.stringify(body);
  return { ok: status >= 200 && status < 300, status, text: () => Promise.resolve(text) };
}

/** Replaces global fetch with a jest mock and returns it. */
export function installFetchMock(): jest.Mock {
  const mock = jest.fn();
  global.fetch = mock as unknown as typeof fetch;
  return mock;
}

/** The [url, init] of the nth fetch call, with the JSON body parsed. */
export function fetchCall(mock: jest.Mock, n = 0) {
  const [url, init] = mock.mock.calls[n];
  return { url: url as string, init: init as RequestInit, body: init?.body ? JSON.parse(init.body as string) : undefined };
}

/** Builds an unsigned JWT with the given payload (jwt-decode only reads the payload). */
export function fakeJwt(payload: Record<string, unknown>): string {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}.signature`;
}
