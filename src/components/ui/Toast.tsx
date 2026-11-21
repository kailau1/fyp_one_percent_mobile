import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '@/theme/ThemeProvider'
import { radius } from '@/theme/tokens'
import { Text } from './Text'

/**
 * Short messages after an action ("Entry deleted", or why something failed), like the web app's
 * sonner toasts: `toast.success(…)` / `toast.error(…)` from anywhere, shown by one <ToastHost/>.
 */
type Toast = { id: number; kind: 'success' | 'error' | 'info'; message: string }
let nextId = 1
let listener: ((toast: Toast) => void) | null = null
const show = (kind: Toast['kind']) => (message: string) => listener?.({ id: nextId++, kind, message })

export const toast = Object.assign(show('info'), { success: show('success'), error: show('error') })

const SHOW_MS = 3500

export function ToastHost() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    listener = (t) => {
      setToasts((all) => [...all.slice(-2), t])
      setTimeout(() => setToasts((all) => all.filter((x) => x.id !== t.id)), SHOW_MS)
    }
    return () => {
      listener = null
    }
  }, [])

  if (toasts.length === 0) return null
  return (
    <View pointerEvents="none" style={[styles.host, { bottom: insets.bottom + 72 }]}>
      {toasts.map((t) => (
        <View
          key={t.id}
          role={t.kind === 'error' ? 'alert' : 'status'}
          accessibilityLiveRegion="polite"
          style={[styles.toast, { backgroundColor: colors.surface, borderColor: t.kind === 'error' ? colors.danger : colors.line }]}
        >
          <Text variant="small" tone={t.kind === 'error' ? 'danger' : 'ink'}>
            {t.message}
          </Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 16, right: 16, gap: 8, alignItems: 'center' },
  toast: {
    borderWidth: 1,
    borderRadius: radius.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: 480,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
})
