import { useEffect, useState } from 'react'
import { AccessibilityInfo, Animated, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native'
import { useTheme } from '@/theme/ThemeProvider'
import { radius } from '@/theme/tokens'

/** A placeholder shaped like the content that's loading; gently pulses unless reduce motion is on. */
export function Skeleton({ width = '100%', height = 16, style }: { width?: DimensionValue; height?: number; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme()
  const [opacity] = useState(() => new Animated.Value(1))

  useEffect(() => {
    let loop: Animated.CompositeAnimation | undefined
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (reduce) return
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        ]),
      )
      loop.start()
    })
    return () => loop?.stop()
  }, [opacity])

  return <Animated.View style={[{ width, height, borderRadius: radius.control, backgroundColor: colors.sunken, opacity }, style]} />
}
