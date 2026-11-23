import { ChevronRight, Flame } from 'lucide-react-native'
import { Pressable, View } from 'react-native'
import type { Habit } from '@/api/types'
import { Text } from '@/components/ui/Text'
import { useTheme } from '@/theme/ThemeProvider'
import { radius } from '@/theme/tokens'
import { habitTitle, safeColour } from '../habit'
import { HabitTitle } from './HabitTitle'
import { HabitToggle } from './HabitToggle'

/** One habit: tick it off on the left, open its details by tapping the rest. */
export function HabitRow({ habit, streak, onToggle, onOpen }: { habit: Habit; streak: number; onToggle: (completed: boolean) => void; onOpen: () => void }) {
  const { colors } = useTheme()
  const title = habitTitle(habit)
  const streakText = streak > 0 ? `${streak} ${streak === 1 ? 'day' : 'days'}` : null
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.line }}>
      <HabitToggle checked={habit.completed} onChange={onToggle} label={title} colour={safeColour(habit.colour)} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}${streakText ? `, streak ${streakText}` : ''}, open details`}
        onPress={onOpen}
        style={({ pressed }) => ({ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, opacity: pressed ? 0.7 : 1 })}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <HabitTitle habit={habit} muted={habit.completed} numberOfLines={2} style={{ fontSize: 18, lineHeight: 26 }} />
          {habit.habitType === 'standard' && habit.description ? (
            <Text variant="small" tone="muted" numberOfLines={1}>
              {habit.description}
            </Text>
          ) : null}
        </View>
        {streakText && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: radius.full, backgroundColor: colors.sunriseWash, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Flame size={14} color={colors.sunrise} />
            <Text variant="small" weight="medium">
              {streakText}
            </Text>
          </View>
        )}
        <ChevronRight size={16} color={colors.inkFaint} />
      </Pressable>
    </View>
  )
}
