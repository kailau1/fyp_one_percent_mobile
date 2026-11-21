import { X } from 'lucide-react-native'
import { Pressable, View } from 'react-native'
import { useTheme } from '@/theme/ThemeProvider'
import { radius } from '@/theme/tokens'
import { Text } from './Text'

/** A small pill, e.g. a theme. With `onRemove` it gets an x button (named by `removeLabel`). */
export function Chip({ label, onRemove, removeLabel }: { label: string; onRemove?: () => void; removeLabel?: string }) {
  const { colors } = useTheme()
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: colors.line,
        backgroundColor: colors.surface,
        paddingLeft: 12,
        paddingRight: onRemove ? 4 : 12,
        paddingVertical: 3,
      }}
    >
      <Text variant="small" tone="muted">
        {label}
      </Text>
      {onRemove && (
        <Pressable onPress={onRemove} accessibilityRole="button" accessibilityLabel={removeLabel ?? `Remove ${label}`} hitSlop={12} style={{ padding: 3 }}>
          <X size={14} color={colors.inkFaint} />
        </Pressable>
      )}
    </View>
  )
}
