import { CircleAlert, RotateCw, WifiOff } from 'lucide-react-native'
import { View, type StyleProp, type ViewStyle } from 'react-native'
import { toApiError } from '@/api/client'
import { useTheme } from '@/theme/ThemeProvider'
import { radius } from '@/theme/tokens'
import { Button } from './ui/Button'
import { Text } from './ui/Text'

interface ErrorStateProps {
  /** Anything thrown is accepted and turned into a message that is safe to show. */
  error: unknown
  /** Shows a "Try again" button when provided. */
  onRetry?: () => void
  /** Disables the button while a retry is in flight. */
  retrying?: boolean
  /** A slim banner (e.g. above data that is still on screen) instead of a block. */
  compact?: boolean
  style?: StyleProp<ViewStyle>
}

/**
 * One consistent way to say "that didn't work": what happened, and a way to try again.
 * Being unable to reach the server looks different from the server answering with an error.
 */
export function ErrorState({ error, onRetry, retrying, compact, style }: ErrorStateProps) {
  const { colors } = useTheme()
  const apiError = toApiError(error)
  const offline = apiError.isOffline
  const Icon = offline ? WifiOff : CircleAlert

  return (
    <View
      role="alert"
      accessibilityLiveRegion="polite"
      style={[
        {
          borderRadius: radius.card,
          borderWidth: 1,
          borderColor: offline ? colors.warningLine : colors.danger + '4d',
          backgroundColor: offline ? colors.warningWash : colors.dangerWash,
        },
        compact ? { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 } : { gap: 12, padding: 20 },
        style,
      ]}
    >
      <Icon size={compact ? 16 : 24} color={offline ? colors.ink : colors.danger} />
      <View style={compact ? { flex: 1 } : undefined}>
        {!compact && <Text weight="semibold">{offline ? "Can't connect" : 'Something went wrong'}</Text>}
        <Text variant={compact ? 'small' : 'body'} tone={compact ? 'ink' : 'muted'} style={!compact && { marginTop: 4 }}>
          {apiError.message}
        </Text>
      </View>
      {onRetry && (
        <Button variant="secondary" size="sm" icon={RotateCw} onPress={onRetry} disabled={retrying}>
          Try again
        </Button>
      )}
    </View>
  )
}
