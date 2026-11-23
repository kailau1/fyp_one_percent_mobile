import { getCalendars } from 'expo-localization'

/** The phone's IANA time zone, e.g. "Europe/London", or null if it can't be read. */
export function deviceTimeZone(): string | null {
  try {
    return getCalendars()[0]?.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? null
  } catch {
    return null
  }
}
