import AsyncStorage from '@react-native-async-storage/async-storage'

/**
 * Small app preferences and drafts, with the same synchronous interface as the web app's
 * localStorage wrapper, so code ported from the web works unchanged. AsyncStorage itself is
 * asynchronous: everything is read into memory once at launch (hydrateStorage, behind the splash
 * screen), then reads come from memory and writes go to both. A failed write just isn't persisted.
 */
const PREFIX = 'onepercent.'
const memory = new Map<string, string>()

export async function hydrateStorage(): Promise<void> {
  try {
    const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(PREFIX))
    for (const [key, value] of await AsyncStorage.multiGet(keys)) {
      if (value !== null) memory.set(key.slice(PREFIX.length), value)
    }
  } catch {
    /* not available: start empty */
  }
}

export const storage = {
  get(key: string): string | null {
    return memory.get(key) ?? null
  },
  set(key: string, value: string): void {
    memory.set(key, value)
    AsyncStorage.setItem(PREFIX + key, value).catch(() => {})
  },
  remove(key: string): void {
    memory.delete(key)
    AsyncStorage.removeItem(PREFIX + key).catch(() => {})
  },
  getJson<T>(key: string): T | null {
    const raw = storage.get(key)
    if (!raw) return null
    try {
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  },
  setJson(key: string, value: unknown): void {
    storage.set(key, JSON.stringify(value))
  },
  /** For tests: forget everything. */
  clearAll(): void {
    memory.clear()
  },
}
