import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { useColorScheme } from 'react-native'
import { storage } from '@/lib/storage'
import { dark, light, type Palette } from './tokens'

/** "system" follows the phone's setting; light or dark is the user's own choice, remembered. */
export type ThemeMode = 'system' | 'light' | 'dark'

interface ThemeValue {
  colors: Palette
  scheme: 'light' | 'dark'
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeValue | null>(null)

function savedMode(): ThemeMode {
  const saved = storage.get('theme')
  return saved === 'light' || saved === 'dark' ? saved : 'system'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme()
  const [mode, setModeState] = useState<ThemeMode>(savedMode)
  const scheme = mode === 'system' ? (system === 'dark' ? 'dark' : 'light') : mode

  const setMode = useCallback((next: ThemeMode) => {
    if (next === 'system') storage.remove('theme')
    else storage.set('theme', next)
    setModeState(next)
  }, [])

  const value = useMemo(
    () => ({ colors: scheme === 'dark' ? dark : light, scheme, mode, setMode }),
    [scheme, mode, setMode],
  )
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext)
  if (!value) throw new Error('useTheme must be used inside ThemeProvider')
  return value
}
