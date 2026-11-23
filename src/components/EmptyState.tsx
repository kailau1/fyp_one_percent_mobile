import type { ReactNode } from 'react'
import { View, type StyleProp, type ViewStyle } from 'react-native'
import { useTheme } from '@/theme/ThemeProvider'
import { radius } from '@/theme/tokens'
import { Text } from './ui/Text'

/** Shown when there is nothing yet: says so plainly and offers the next step. */
export function EmptyState({ title, children, action, style }: { title: string; children?: ReactNode; action?: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme()
  return (
    <View style={[{ gap: 8, padding: 24, borderRadius: radius.card, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.line }, style]}>
      <Text variant="subheading">{title}</Text>
      {children ? <Text tone="muted">{children}</Text> : null}
      {action ? <View style={{ marginTop: 12 }}>{action}</View> : null}
    </View>
  )
}
