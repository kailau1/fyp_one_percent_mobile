import { useNetInfo } from '@react-native-community/netinfo'
import { WifiOff } from 'lucide-react-native'
import { View } from 'react-native'
import { useTheme } from '@/theme/ThemeProvider'
import { Text } from './ui/Text'

/** A strip across the top while the phone is offline. Anything typed stays on screen. */
export function OfflineBanner() {
  const { colors } = useTheme()
  const { isConnected } = useNetInfo()
  if (isConnected !== false) return null // unknown counts as online, so it never flashes on launch
  return (
    <View
      role="status"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: colors.warningWash,
        borderBottomWidth: 1,
        borderBottomColor: colors.warningLine,
      }}
    >
      <WifiOff size={16} color={colors.ink} />
      <Text variant="small">You’re offline. Changes can’t be saved until you reconnect.</Text>
    </View>
  )
}
