import Constants from 'expo-constants';

/** How long to wait for the server before giving up. AI calls pass a longer timeout. */
export const DEFAULT_TIMEOUT_MS = 15_000;
export const AI_TIMEOUT_MS = 60_000;

export type ApiErrorKind =
  | 'network' // couldn't reach the server at all (offline, wrong IP, server not running)
  | 'timeout' // reached it, but no reply in time
  | 'unauthorized' // 401/403: missing, invalid or expired token
  | 'notFound' // 404
  | 'badRequest' // other 4xx: the server rejected what we sent
  | 'server' // 5xx
  | 'config' // the app has no BASE_URL configured
  | 'unknown';

const FRIENDLY_MESSAGES: Record<ApiErrorKind, string> = {
  network: "Can't reach the One Percent server. Check your connection and try again.",
  timeout: 'The server is taking too long to respond. Please try again.',
  unauthorized: 'Your session has expired. Please log in again.',
  notFound: "That item couldn't be found. It may have been deleted.",
  badRequest: "Something about that request wasn't right. Please check and try again.",
  server: 'Something went wrong on the server. Please try again in a moment.',
  config: "The app isn't configured with a server address (BASE_URL in app.json).",
  unknown: 'Something went wrong. Please try again.',
};

/** Every failed API call throws one of these, with a message that is safe to show users. */
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  /** Raw response body, for logging; not for display. */
  readonly detail?: string;

  constructor(kind: ApiErrorKind, message?: string, status?: number, detail?: string) {
    super(message ?? FRIENDLY_MESSAGES[kind]);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.detail = detail;
  }

  /** True when the server couldn't be reached, as opposed to replying with an error. */
  get isOffline(): boolean {
    return this.kind === 'network' || this.kind === 'timeout';
  }
}

/** Normalises anything thrown into an ApiError so UI code only handles one shape. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  return new ApiError('unknown', undefined, undefined, error instanceof Error ? error.message : String(error));
}

/** A user-facing message for any thrown value. */
export function getErrorMessage(error: unknown): string {
  return toApiError(error).message;
}

function kindForStatus(status: number): ApiErrorKind {
  if (status === 401 || status === 403) return 'unauthorized';
  if (status === 404) return 'notFound';
  if (status >= 400 && status < 500) return 'badRequest';
  return 'server';
}

function getBaseUrl(): string | undefined {
  return Constants.expoConfig?.extra?.BASE_URL;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  token?: string;
  body?: unknown;
  timeoutMs?: number;
}

/**
 * Calls the backend and returns the parsed JSON body (or undefined for empty responses).
 * Throws an {@link ApiError} for network failures, timeouts and non-2xx responses.
 */
export async function apiRequest<T = unknown>(
  path: string,
  { method = 'GET', token, body, timeoutMs = DEFAULT_TIMEOUT_MS }: RequestOptions = {},
): Promise<T> {
  const baseUrl = getBaseUrl();
  if (!baseUrl) throw new ApiError('config');

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    const kind = controller.signal.aborted ? 'timeout' : 'network';
    console.warn(`[api] ${method} ${path} failed (${kind}):`, error);
    throw new ApiError(kind, undefined, undefined, error instanceof Error ? error.message : String(error));
  } finally {
    clearTimeout(timer);
  }

  const text = await response.text().catch(() => '');

  if (!response.ok) {
    const kind = kindForStatus(response.status);
    console.warn(`[api] ${method} ${path} -> ${response.status}`, text);
    // A 400 from our API carries a human-readable reason (e.g. "email already exists").
    const message = kind === 'badRequest' && text && text.length < 200 ? text : undefined;
    throw new ApiError(kind, message, response.status, text);
  }

  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError('server', 'The server sent a response the app could not read.', response.status, text);
  }
}
