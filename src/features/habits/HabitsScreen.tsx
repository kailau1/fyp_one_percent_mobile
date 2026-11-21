import { router } from 'expo-router'
import { Plus } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { View } from 'react-native'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Screen } from '@/components/layout/Screen'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { Text } from '@/components/ui/Text'
import { useTheme } from '@/theme/ThemeProvider'
import { radius } from '@/theme/tokens'
import { HabitFormSheet } from './components/HabitFormSheet'
import { HabitRow } from './components/HabitRow'
import { useHabits, useRecentHistory, useToggleHabit } from './hooks'
import { calculateCurrentStreak, withToday } from './streaks'

export function HabitsScreen() {
  const { colors } = useTheme()
  const { data: habits, error, isPending, refetch, isFetching } = useHabits()
  const { data: history, error: historyError, refetch: refetchHistory, isFetching: historyFetching } = useRecentHistory()
  const toggle = useToggleHabit()
  const [adding, setAdding] = useState(false)

  // Current streak per habit, using the live "done today" state so a tick counts straight away.
  const streaks = useMemo(() => {
    const result = new Map<string, number>()
    for (const habit of habits ?? []) {
      const records = (history ?? []).filter((record) => record.habitId === habit.id)
      result.set(habit.id, calculateCurrentStreak(withToday(records, habit.completed)))
    }
    return result
  }, [habits, history])

  const doneCount = habits?.filter((habit) => habit.completed).length ?? 0

  return (
    <Screen
      title="Habits"
      action={
        <Button size="sm" icon={Plus} onPress={() => setAdding(true)}>
          New habit
        </Button>
      }
      onRefresh={() => {
        refetch()
        refetchHistory()
      }}
      refreshing={isFetching && !isPending}
    >
      {isPending && (
        <View role="status" aria-label="Loading habits" style={{ gap: 20 }}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <Skeleton width={36} height={36} style={{ borderRadius: 18 }} />
              <Skeleton height={24} style={{ flex: 1 }} />
            </View>
          ))}
        </View>
      )}
      {error && <ErrorState compact={Boolean(habits)} error={error} onRetry={() => refetch()} retrying={isFetching} style={{ marginBottom: 24 }} />}
      {/* Without history the streak badges would quietly be wrong, so say so. */}
      {historyError && !history && habits && habits.length > 0 && (
        <ErrorState compact error={historyError} onRetry={() => refetchHistory()} retrying={historyFetching} style={{ marginBottom: 24 }} />
      )}
      {habits && habits.length === 0 && (
        <EmptyState title="No habits yet" action={<Button onPress={() => setAdding(true)}>Add your first habit</Button>}>
          Start with one small thing you can do every day. Tick it off here and watch the streak build.
        </EmptyState>
      )}
      {habits && habits.length > 0 && (
        <>
          <Text tone="muted" role="status" style={{ marginBottom: 8 }}>
            {doneCount === habits.length ? `All ${habits.length} done today.` : `${doneCount} of ${habits.length} done today`}
          </Text>
          <View
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel="Habits done today"
            accessibilityValue={{ min: 0, max: habits.length, now: doneCount }}
            style={{ height: 6, borderRadius: radius.full, backgroundColor: colors.sunken, overflow: 'hidden', marginBottom: 16 }}
          >
            <View style={{ height: '100%', width: `${(doneCount / habits.length) * 100}%`, borderRadius: radius.full, backgroundColor: colors.sunrise }} />
          </View>
          <View accessibilityLabel="Your habits">
            {habits.map((habit) => (
              <HabitRow
                key={habit.id}
                habit={habit}
                streak={streaks.get(habit.id) ?? 0}
                onToggle={(completed) => toggle.mutate({ id: habit.id, completed })}
                onOpen={() => router.push({ pathname: '/habits/[id]', params: { id: habit.id } })}
              />
            ))}
          </View>
        </>
      )}
      <HabitFormSheet open={adding} onClose={() => setAdding(false)} />
    </Screen>
  )
}
