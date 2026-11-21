import type { ReactNode } from 'react'
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '@/theme/ThemeProvider'
import { gutter } from '@/theme/tokens'
import { Text } from '../ui/Text'

interface ScreenProps {
  /** The page title, in Literata like the web's <Page>. Leave out for screens with their own header. */
  title?: string
  /** Sits to the right of the title: usually the screen's main action. */
  action?: ReactNode
  children: ReactNode
  /** Pull to refresh. */
  onRefresh?: () => void
  refreshing?: boolean
  /** For screens that manage their own scrolling (lists). */
  scroll?: boolean
}

/** Standard padding, background and heading, so every screen starts at the same place. */
export function Screen({ title, action, children, onRefresh, refreshing = false, scroll = true }: ScreenProps) {
  const { colors } = useTheme()
  const header = title ? (
    <View style={styles.header}>
      <Text variant="title" role="heading" aria-level={1} style={{ flexShrink: 1 }}>
        {title}
      </Text>
      {action}
    </View>
  ) : null

  return (
    <SafeAreaView edges={['top']} style={[styles.fill, { backgroundColor: colors.paper }]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.inkMuted} /> : undefined}
        >
          {header}
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.fill, styles.content]}>
          {header}
          {children}
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingHorizontal: gutter, paddingTop: 24, paddingBottom: 48 },
  header: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 24 },
})
