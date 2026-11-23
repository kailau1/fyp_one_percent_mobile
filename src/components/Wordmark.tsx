import { View } from 'react-native'
import Svg, { Circle, Path } from 'react-native-svg'
import { useTheme } from '@/theme/ThemeProvider'
import { Text } from './ui/Text'

/** The logo and name, as in the web app's sidebar. */
export function Wordmark() {
  const { colors } = useTheme()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }} accessibilityRole="image" accessibilityLabel="One Percent">
      <Svg width={28} height={28} viewBox="0 0 28 28">
        <Path d="M3 22c6-.4 10-2.5 13.5-7 2-2.6 3.5-5 6-7" fill="none" stroke={colors.sky} strokeWidth={2.5} strokeLinecap="round" />
        <Circle cx={23} cy={7.5} r={2.8} fill={colors.sunrise} />
      </Svg>
      <Text variant="subheading" weight="semibold" style={{ letterSpacing: -0.3 }}>
        One Percent
      </Text>
    </View>
  )
}
