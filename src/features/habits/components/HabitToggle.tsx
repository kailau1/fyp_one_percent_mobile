import { Pressable } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { useTheme } from '@/theme/ThemeProvider'

/**
 * The round tick for "done today", in the habit's own colour. A checkbox to screen readers,
 * drawn as a circle with a tick. (No haptics: that module isn't in Expo Go.)
 */
export function HabitToggle({
  checked,
  onChange,
  label,
  colour,
  size = 'md',
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  /** What is being ticked, for screen readers: the habit's title. */
  label: string
  colour: string
  size?: 'md' | 'lg'
}) {
  const { colors } = useTheme()
  const box = size === 'lg' ? 44 : 36
  const tick = size === 'lg' ? 24 : 20
  return (
    <Pressable
      role="checkbox"
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      aria-checked={checked}
      accessibilityLabel={`${label}: done today`}
      onPress={() => onChange(!checked)}
      hitSlop={(44 - box) / 2 + 4}
      style={{
        width: box,
        height: box,
        borderRadius: box / 2,
        borderWidth: 2,
        borderColor: colour,
        backgroundColor: checked ? colour : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {checked && (
        <Svg width={tick} height={tick} viewBox="0 0 24 24">
          <Path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={colors.onHabit} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      )}
    </Pressable>
  )
}
