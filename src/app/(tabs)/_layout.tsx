import { Tabs } from 'expo-router'
import { BookOpenText, CircleUserRound, Lightbulb, ListChecks, SunMedium } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '@/theme/ThemeProvider'
import { fonts } from '@/theme/tokens'

/** The web app's sidebar as a tab bar: Today, Journal, Habits, Insights and Account, same icons. */
export default function TabsLayout() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.action,
        tabBarInactiveTintColor: colors.inkMuted,
        // tall enough for icon + label (descenders included) above the home indicator
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line, height: 64 + insets.bottom, paddingTop: 4, paddingBottom: insets.bottom + 4 },
        tabBarItemStyle: { paddingVertical: 2 },
        tabBarLabelStyle: { fontFamily: fonts.sansMedium, fontSize: 12, lineHeight: 16 },
        sceneStyle: { backgroundColor: colors.paper },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Today', tabBarIcon: ({ color, size }) => <SunMedium color={color} size={size} /> }} />
      <Tabs.Screen name="journal" options={{ title: 'Journal', tabBarIcon: ({ color, size }) => <BookOpenText color={color} size={size} /> }} />
      <Tabs.Screen name="habits" options={{ title: 'Habits', tabBarIcon: ({ color, size }) => <ListChecks color={color} size={size} /> }} />
      <Tabs.Screen name="insights" options={{ title: 'Insights', tabBarIcon: ({ color, size }) => <Lightbulb color={color} size={size} /> }} />
      <Tabs.Screen name="account" options={{ title: 'Account', tabBarIcon: ({ color, size }) => <CircleUserRound color={color} size={size} /> }} />
    </Tabs>
  )
}
