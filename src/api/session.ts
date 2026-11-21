import * as SecureStore from 'expo-secure-store'

/**
 * The login token, kept in one place so the API client can attach it to every request without
 * each feature passing it around. AuthProvider owns logging in and out; this only stores.
 *
 * It lives in the device's secure storage (Keychain / Keystore), read into memory once at launch
 * (hydrateSession) so the API client can read it synchronously, as on the web.
 */
const TOKEN_KEY = 'onepercent.token'
type Listener = () => void
let token: string | null = null
let onExpired: Listener | null = null

export async function hydrateSession(): Promise<void> {
  try {
    // a token set before this finished (only ever in tests) wins over the stored one
    token = token ?? (await SecureStore.getItemAsync(TOKEN_KEY))
  } catch {
    token = null
  }
}

export const session = {
  getToken: (): string | null => token,
  setToken(value: string): void {
    token = value
    SecureStore.setItemAsync(TOKEN_KEY, value).catch(() => {})
  },
  clear(): void {
    token = null
    SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {})
  },
  /** AuthProvider registers what should happen when the server rejects the token. */
  onExpired(listener: Listener | null): void {
    onExpired = listener
  },
  /** Called by the API client on a 401 for a request that carried a token. */
  notifyExpired(): void {
    onExpired?.()
  },
}
