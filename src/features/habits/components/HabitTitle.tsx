import { Text as Inline } from 'react-native'
import type { TextProps } from '@/components/ui/Text'
import { Text } from '@/components/ui/Text'
import { useTheme } from '@/theme/ThemeProvider'
import { fonts } from '@/theme/tokens'
import { habitClause, habitTitle, type HabitTitleFields } from '../habit'

/**
 * A habit's title as shown on screen. Same text as `habitTitle()` (use that for labels), but in
 * trigger → action habits "When I" and "I will" are a little bolder (and whiter in dark mode), so
 * the two halves stand out, as on the web.
 */
export function HabitTitle({ habit, muted = false, ...text }: { habit: HabitTitleFields; muted?: boolean } & TextProps) {
  const { colors } = useTheme()
  if (habit.habitType !== 'trigger-action') {
    return (
      <Text serif tone={muted ? 'muted' : 'ink'} {...text}>
        {habitTitle(habit)}
      </Text>
    )
  }
  const lead = { fontFamily: fonts.serifSemiBold, color: muted ? colors.inkMuted : colors.inkStrong }
  return (
    <Text serif tone={muted ? 'muted' : 'ink'} {...text}>
      {/* plain nested text inherits the title's size; only the weight and colour change */}
      <Inline style={lead}>When I</Inline>{' '}
      {habitClause(habit.trigger)},{' '}
      <Inline style={lead}>I will</Inline>{' '}
      {habitClause(habit.action)}
    </Text>
  )
}
