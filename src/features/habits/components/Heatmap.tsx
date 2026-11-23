import { useMemo, useState } from 'react'
import { View } from 'react-native'
import { Text } from '@/components/ui/Text'
import { useTheme } from '@/theme/ThemeProvider'
import { completedDays, toDayNumber, type DayRecord } from '../streaks'

const WEEKDAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', '']
const CELL = 14
const GAP = 4

/**
 * A calendar of recent weeks (columns) by weekday (rows): filled on days the habit was done.
 * 15 weeks fit a phone's width (the web shows 18). Same day arithmetic as the web's heatmap.
 */
export function Heatmap({ history, colour, weeks = 15, today }: { history: DayRecord[]; colour: string; weeks?: number; today?: Date }) {
  const { colors } = useTheme()
  const [now] = useState(() => new Date())
  const todayNumber = toDayNumber(today ?? now)
  const { columns, doneCount, dayCount } = useMemo(() => {
    const done = completedDays(history)
    // 1 Jan 1970 was a Thursday, so (day number + 3) % 7 is 0 on Mondays
    const weekday = (((todayNumber + 3) % 7) + 7) % 7
    const firstDay = todayNumber - weekday - (weeks - 1) * 7
    const columns = Array.from({ length: weeks }, (_, week) =>
      Array.from({ length: 7 }, (_, day) => {
        const dayNumber = firstDay + week * 7 + day
        return { dayNumber, future: dayNumber > todayNumber, isDone: done.has(dayNumber), isToday: dayNumber === todayNumber }
      }),
    )
    const past = columns.flat().filter((cell) => !cell.future)
    return { columns, dayCount: past.length, doneCount: past.filter((cell) => cell.isDone).length }
  }, [history, weeks, todayNumber])

  const summary = `Done on ${doneCount} of the last ${dayCount} days`
  return (
    <View>
      <View accessibilityRole="image" accessibilityLabel={summary} style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ gap: GAP }}>
          {WEEKDAY_LABELS.map((label, index) => (
            <Text key={index} variant="xs" tone="muted" style={{ height: CELL, lineHeight: CELL }}>
              {label}
            </Text>
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: GAP }}>
          {columns.map((column, week) => (
            <View key={week} style={{ gap: GAP }}>
              {column.map((cell) => (
                <View
                  key={cell.dayNumber}
                  style={{
                    width: CELL,
                    height: CELL,
                    borderRadius: 3,
                    backgroundColor: cell.future ? 'transparent' : cell.isDone ? colour : colors.sunken,
                    borderWidth: cell.isToday ? 1 : 0,
                    borderColor: colors.inkMuted,
                  }}
                />
              ))}
            </View>
          ))}
        </View>
      </View>
      <Text variant="small" tone="muted" style={{ marginTop: 12 }}>
        {summary}
      </Text>
    </View>
  )
}
