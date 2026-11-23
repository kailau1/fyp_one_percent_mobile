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

function Navigation() {
  const { colors, scheme } = useTheme()
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <OfflineBanner />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper } }}>
        <Stack.Screen name="(tabs)" />
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
