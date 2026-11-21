import { useQueryClient } from '@tanstack/react-query'
import { addDays, format, min, startOfYear } from 'date-fns'
import { router } from 'expo-router'
import { ArrowRight, PenLine } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { Pressable, View } from 'react-native'
import { ErrorState } from '@/components/ErrorState'
import { Screen } from '@/components/layout/Screen'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { Text } from '@/components/ui/Text'
import { TipCard } from '@/features/ai/TipCard'
import { useUser } from '@/features/auth/useAuth'
import { HabitTitle } from '@/features/habits/components/HabitTitle'
import { HabitToggle } from '@/features/habits/components/HabitToggle'
import { habitTitle, safeColour } from '@/features/habits/habit'
import { useHabits, useRecentHistory, useToggleHabit } from '@/features/habits/hooks'
import { toDayKey, toDayNumber } from '@/features/habits/streaks'
import { useEntryDays, useRecentEntries } from '@/features/journal/hooks'
import { WeekReadyCard } from '@/features/reflections/WeekReadyCard'
import { formatDay, parseDateTime } from '@/lib/dates'
import { useTheme } from '@/theme/ThemeProvider'
import { activeDays } from './activity'
import { YearRibbon } from './YearRibbon'

function greeting(hour: number): string {
  if (hour < 5) return 'Still up'
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

/** The day at a glance: the last twelve weeks, today's habits, and a way into the journal. */
export function TodayScreen() {
  const { colors } = useTheme()
  const user = useUser()
  const [now] = useState(() => new Date())
  const habits = useHabits()
  const entries = useRecentEntries(3)
  // Which days had an entry, without downloading the entries: back far enough for the ribbon and
  // the year's count, and on to tomorrow in case the server's idea of today is ahead of this phone's.
  const entryDays = useEntryDays(toDayKey(min([startOfYear(now), addDays(now, -83)])), toDayKey(addDays(now, 1)))
  const history = useRecentHistory()
  const toggle = useToggleHabit()
  const queryClient = useQueryClient()

  // When several things fail at once (typically: the server is unreachable) show ONE banner with
  // ONE retry for the whole screen, instead of an error and a button in every section.
  const failed = [habits, entries, entryDays, history].filter((query) => query.error)
  const pageError = failed[0]?.error ?? null
  const retrying = failed.some((query) => query.isFetching)
  function retryAll() {
    for (const query of failed) query.refetch()
    queryClient.refetchQueries({ predicate: (query) => query.state.status === 'error' })
  }
  function refreshAll() {
    for (const query of [habits, entries, entryDays, history]) query.refetch()
  }

  const active = useMemo(() => activeDays(entryDays.data, history.data, habits.data, now), [entryDays.data, history.data, habits.data, now])

  const recentEntries = entries.data?.items ?? []
  // entries come newest first, so if one was written today it's the first
  const newest = recentEntries[0]
  const newestWritten = parseDateTime(newest?.createdAt)
  const todaysEntry = newestWritten && toDayNumber(newestWritten) === toDayNumber(now) ? newest : undefined
  const doneCount = habits.data?.filter((habit) => habit.completed).length ?? 0

  return (
    <Screen onRefresh={refreshAll} refreshing={failed.length === 0 && [habits, entries].some((q) => q.isRefetching)}>
      <View style={{ gap: 40 }}>
        <View>
          <Text tone="muted" style={{ marginBottom: 4 }}>
            {greeting(now.getHours())}, {user.firstName}
          </Text>
          <Text variant="title" role="heading" aria-level={1}>
            {format(now, 'EEEE d MMMM')}
          </Text>
        </View>

        {pageError && <ErrorState compact error={pageError} onRetry={retryAll} retrying={retrying} />}

        <WeekReadyCard entryDays={entryDays.data} now={now} />

        <YearRibbon active={active} today={now} unavailable={(Boolean(history.error) && !history.data) || (Boolean(entryDays.error) && !entryDays.data)} />

        <View accessibilityLabel="Today’s habits">
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, marginBottom: 12 }}>
            <Text variant="heading" role="heading">
              Today’s habits
            </Text>
            {habits.data && habits.data.length > 0 && (
              <Text variant="small" tone="muted">
                {doneCount} of {habits.data.length} done
              </Text>
            )}
          </View>
          {habits.isPending && (
            <View role="status" aria-label="Loading habits" style={{ gap: 16 }}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                  <Skeleton width={36} height={36} style={{ borderRadius: 18 }} />
                  <Skeleton height={20} style={{ flex: 1 }} />
                </View>
              ))}
            </View>
          )}
          {habits.error && !habits.data && <Text tone="muted">Not loaded.</Text>}
          {habits.data && habits.data.length === 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4 }}>
              <Text tone="muted">No habits yet.</Text>
              <Button variant="link" onPress={() => router.navigate('/habits')}>
                Add your first habit
              </Button>
            </View>
          )}
          {habits.data && habits.data.length > 0 && (
            <>
              {habits.data.map((habit) => (
                <View key={habit.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line }}>
                  <HabitToggle checked={habit.completed} onChange={(completed) => toggle.mutate({ id: habit.id, completed })} label={habitTitle(habit)} colour={safeColour(habit.colour)} />
                  <HabitTitle habit={habit} muted={habit.completed} numberOfLines={1} style={{ flex: 1, fontSize: 18, lineHeight: 26 }} />
                </View>
              ))}
              <Button variant="link" size="sm" icon={ArrowRight} onPress={() => router.navigate('/habits')} style={{ marginTop: 16 }}>
                Streaks and history
              </Button>
            </>
          )}
        </View>

        <View accessibilityLabel="Journal">
          <Text variant="heading" role="heading" style={{ marginBottom: 16 }}>
            Journal
          </Text>
          <Button
            size="lg"
            icon={PenLine}
            onPress={() => (todaysEntry ? router.push({ pathname: '/journal/[id]', params: { id: todaysEntry.id } }) : router.push('/journal/new'))}
            style={{ marginBottom: 20 }}
          >
            {todaysEntry ? 'Continue today’s entry' : 'Write today’s entry'}
          </Button>
          {entries.isPending && (
            <View role="status" aria-label="Loading entries" style={{ gap: 12 }}>
              <Skeleton height={20} width="75%" />
              <Skeleton height={20} width="66%" />
            </View>
          )}
          {entries.error && !entries.data && <Text tone="muted">Not loaded.</Text>}
          {recentEntries.map((entry) => {
            const written = parseDateTime(entry.createdAt)
            const title = entry.title?.trim() || 'Untitled'
            return (
              <Pressable
                key={entry.id}
                accessibilityRole="link"
                accessibilityLabel={title}
                onPress={() => router.push({ pathname: '/journal/[id]', params: { id: entry.id } })}
                style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line, opacity: pressed ? 0.7 : 1 })}
              >
                <Text serif numberOfLines={1} style={{ flex: 1, fontSize: 18, lineHeight: 26 }}>
                  {title}
                </Text>
                {written && (
                  <Text variant="small" tone="muted">
                    {formatDay(written)}
                  </Text>
                )}
              </Pressable>
            )
          })}
          {entries.data && entries.data.totalItems === 0 && <Text tone="muted">Nothing written yet. The first entry is the hardest; keep it short.</Text>}
        </View>

        <TipCard quietErrors={pageError !== null} />
      </View>
    </Screen>
  )
}
