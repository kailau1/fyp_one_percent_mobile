import NetInfo from '@react-native-community/netinfo'
import { focusManager, onlineManager, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'
import { AppState, Platform } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { createQueryClient } from '@/api/queryClient'
import { ThemeProvider } from '@/theme/ThemeProvider'
import { ToastHost } from './ui/Toast'

// TanStack Query was made for browsers: tell it when the app comes back to the foreground
// ("window focus") and when the phone goes on or offline, so data refreshes as on the web.
onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => setOnline(state.isConnected !== false)),
)

function useAppFocus() {
  useEffect(() => {
    if (Platform.OS === 'web') return
    const subscription = AppState.addEventListener('change', (status) => focusManager.setFocused(status === 'active'))
    return () => subscription.remove()
  }, [])
}

/** Everything every screen needs: data cache, theme, safe areas and toasts. */
export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient)
  useAppFocus()
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          {children}
          <ToastHost />
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}
