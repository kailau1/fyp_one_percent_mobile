import { Figtree_400Regular, Figtree_500Medium, Figtree_600SemiBold, Figtree_700Bold } from '@expo-google-fonts/figtree'
import { Literata_400Regular, Literata_500Medium, Literata_600SemiBold } from '@expo-google-fonts/literata'
import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { hydrateSession } from '@/api/session'
import { AppProviders } from '@/components/AppProviders'
import { OfflineBanner } from '@/components/OfflineBanner'
import { useAuth } from '@/features/auth/useAuth'
import { hydrateStorage } from '@/lib/storage'
import { useTheme } from '@/theme/ThemeProvider'

SplashScreen.preventAutoHideAsync()

/** Load saved preferences and the login token before the first screen draws. */
function useStartup() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    Promise.all([hydrateStorage(), hydrateSession()]).finally(() => setReady(true))
  }, [])
  return ready
}

/**
 * The app's screens behind login, and login/sign-up only when logged out (the web's RequireAuth and
 * PublicOnly). When the session ends, by choice or because the server rejected it, the app returns
 * to login on its own.
 */
function Navigation() {
  const { colors, scheme } = useTheme()
  const { user } = useAuth()
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <OfflineBanner />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper } }}>
        <Stack.Protected guard={user !== null}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="journal/[id]" />
          <Stack.Screen name="journal/new" />
          <Stack.Screen name="habits/[id]" />
          <Stack.Screen name="insights/week/[weekStart]" />
          <Stack.Screen name="about-you" />
        </Stack.Protected>
        <Stack.Protected guard={user === null}>
          <Stack.Screen name="login" />
          <Stack.Screen name="signup" />
        </Stack.Protected>
      </Stack>
    </>
  )
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
    Literata_400Regular,
    Literata_500Medium,
    Literata_600SemiBold,
  })
  const ready = useStartup()
  const loaded = (fontsLoaded || fontError !== null) && ready

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync()
  }, [loaded])

  if (!loaded) return null
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProviders>
        <Navigation />
      </AppProviders>
    </GestureHandlerRootView>
  )
}
