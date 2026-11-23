import { router } from 'expo-router'
import { LogOut } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { ErrorState } from '@/components/ErrorState'
import { Screen } from '@/components/layout/Screen'
import { Button } from '@/components/ui/Button'
import { Segmented } from '@/components/ui/Segmented'
import { Skeleton } from '@/components/ui/Skeleton'
import { Text } from '@/components/ui/Text'
import { useAuth, useUser } from '@/features/auth/useAuth'
import { ExportSection } from '@/features/export/ExportSection'
import { useTheme, type ThemeMode } from '@/theme/ThemeProvider'
import { useProfile } from './hooks'

/** "Europe/London" → "Europe / London"; underscores in zone names ("New_York") become spaces. */
function zoneName(zone: string): string {
  return zone.replace(/_/g, ' ').replace(/\//g, ' / ')
}

/** The time zone the server counts days in (not the phone's guess: they differ until synced). */
function TimeZone() {
  const { data, error, isPending, refetch, isFetching } = useProfile()
  if (isPending) return <Skeleton width={160} height={20} />
  if (error && !data) return <ErrorState compact error={error} onRetry={() => refetch()} retrying={isFetching} />
  if (!data.timeZone) return <Text tone="muted">Not set yet. Days follow the server’s clock until this phone sets it.</Text>
  return (
    <View style={{ gap: 4 }}>
      <Text>{zoneName(data.timeZone)}</Text>
      <Text variant="small" tone="muted">
        Your days, and your habits, start at midnight here. It follows the device you use.
      </Text>
    </View>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.row}>
      <Text tone="muted">{label}</Text>
      <View style={{ flexShrink: 1 }}>{typeof children === 'string' ? <Text>{children}</Text> : children}</View>
    </View>
  )
}

export function AccountScreen() {
  const user = useUser()
  const { logout } = useAuth()
  const { colors, mode, setMode } = useTheme()

  return (
    <Screen title="Account">
      <View style={[styles.details, { borderColor: colors.line }]}>
        <Row label="Name">{`${user.firstName} ${user.lastName}`}</Row>
        <Row label="Email">{user.email}</Row>
        <Row label="Time zone">
          <TimeZone />
        </Row>
      </View>

      <View style={styles.section}>
        <Text variant="heading" role="heading" aria-level={2}>
          What One Percent knows
        </Text>
        <Text tone="muted">See and change the context the AI is given about you when it gives feedback.</Text>
        <Button variant="secondary" onPress={() => router.push('/about-you')}>
          Open
        </Button>
      </View>

      <View style={styles.section}>
        <ExportSection />
      </View>

      <View style={styles.section}>
        <Text variant="heading" role="heading" aria-level={2}>
          Appearance
        </Text>
        <Segmented<ThemeMode>
          label="Appearance"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'system', label: 'System' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
        />
      </View>

      <View style={[styles.section, styles.logout, { borderTopColor: colors.line }]}>
        <Button variant="secondary" icon={LogOut} onPress={logout}>
          Log out
        </Button>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  details: { borderTopWidth: 1, borderBottomWidth: 1, paddingVertical: 20, gap: 16, marginBottom: 40 },
  row: { gap: 4 },
  section: { gap: 12, marginBottom: 40 },
  logout: { borderTopWidth: 1, paddingTop: 32 },
})
