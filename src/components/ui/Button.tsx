import type { ComponentType, ReactNode } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { useTheme } from '@/theme/ThemeProvider'
import { minTouch, radius } from '@/theme/tokens'
import { Text } from './Text'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link'

export interface ButtonProps {
  children: ReactNode
  onPress?: () => void
  variant?: Variant
  size?: 'sm' | 'md' | 'lg'
  /** A lucide icon component, drawn before the label. */
  icon?: ComponentType<{ size?: number; color?: string }>
  disabled?: boolean
  /** Shows a spinner and blocks presses, so a slow request can't be sent twice. */
  loading?: boolean
  accessibilityLabel?: string
  style?: StyleProp<ViewStyle>
}

const heights = { sm: 36, md: 44, lg: 48 }

/** The web app's buttons: primary, secondary, ghost, danger and link, at least 44pt tall to tap. */
export function Button({ children, onPress, variant = 'primary', size = 'md', icon: Icon, disabled, loading, accessibilityLabel, style }: ButtonProps) {
  const { colors } = useTheme()
  const inactive = disabled || loading
  const fg = { primary: colors.onAction, secondary: colors.ink, ghost: colors.inkMuted, danger: colors.surface, link: colors.action }[variant]

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      hitSlop={size === 'sm' ? (minTouch - heights.sm) / 2 : undefined}
      style={({ pressed }) => [
        styles.base,
        { minHeight: heights[size], paddingHorizontal: size === 'sm' ? 12 : size === 'lg' ? 24 : 16 },
        variant === 'primary' && { backgroundColor: pressed ? colors.actionPressed : colors.action },
        variant === 'secondary' && { backgroundColor: pressed ? colors.sunken : colors.surface, borderWidth: 1, borderColor: colors.line },
        variant === 'ghost' && pressed && { backgroundColor: colors.sunken },
        variant === 'danger' && { backgroundColor: colors.danger, opacity: pressed ? 0.9 : 1 },
        variant === 'link' && { paddingHorizontal: 0, minHeight: undefined, opacity: pressed ? 0.7 : 1 },
        inactive && { opacity: 0.5 },
        style,
      ]}
    >
      <View style={styles.row}>
        {loading ? <ActivityIndicator size="small" color={fg} /> : Icon ? <Icon size={16} color={fg} /> : null}
        <Text variant={size === 'sm' ? 'small' : 'body'} weight="medium" style={{ color: fg }}>
          {children}
        </Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.control, justifyContent: 'center', alignItems: 'center', alignSelf: 'flex-start' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
})
