import { router, useLocalSearchParams } from 'expo-router'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { getErrorMessage } from '@/api/client'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/Sheet'
import { Skeleton } from '@/components/ui/Skeleton'
import { Text } from '@/components/ui/Text'
import { toast } from '@/components/ui/Toast'
import { useTheme } from '@/theme/ThemeProvider'
import { gutter } from '@/theme/tokens'
import { HabitFormSheet } from './components/HabitFormSheet'
import { HabitTitle } from './components/HabitTitle'
import { HabitToggle } from './components/HabitToggle'
import { Heatmap } from './components/Heatmap'
import { habitTitle, safeColour } from './habit'
import { useDeleteHabit, useHabitHistory, useHabits, useToggleHabit } from './hooks'
import { calculateCurrentStreak, calculateLongestStreak, withToday } from './streaks'

function Stat({ label, days }: { label: string; days: number }) {
  return (
    <View style={{ flex: 1 }}>
      <Text variant="small" tone="muted">
        {label}
      </Text>
      <Text serif style={{ fontSize: 30, lineHeight: 38 }}>
        {days}{' '}
        <Text tone="muted" style={{ fontSize: 16 }}>
          {days === 1 ? 'day' : 'days'}
        </Text>
      </Text>
    </View>
  )
}

/** /habits/:id: one habit's streaks and history, with edit and delete (the web's drawer). */
export function HabitDetailScreen() {
  const { colors } = useTheme()
  const { id } = useLocalSearchParams<{ id: string }>()
  const habits = useHabits()
  const habit = habits.data?.find((h) => h.id === id) ?? null
  const history = useHabitHistory(habit?.id)
  const toggle = useToggleHabit()
  const deleteHabit = useDeleteHabit()
  const [editing, setEditing] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  function confirmDelete() {
    if (!habit) return
    deleteHabit.mutate(habit.id, {
      onSuccess: () => {
        setConfirmingDelete(false)
        toast.success('Habit deleted')
        router.back()
      },
      onError: (error) => {
        setConfirmingDelete(false)
        toast.error(getErrorMessage(error))
      },
    })
  }

  const colour = safeColour(habit?.colour)
  const records = habit && history.data ? withToday(history.data, habit.completed) : null

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.paper }}>
      <View style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="All habits" hitSlop={10} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={22} color={colors.ink} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 48, gap: 32 }}>
        {habits.isPending && <Skeleton height={36} width="70%" />}
        {habits.error && !habits.data && <ErrorState error={habits.error} onRetry={() => habits.refetch()} retrying={habits.isFetching} />}
        {habits.data && !habit && (
          <EmptyState title="This habit doesn’t exist" action={<Button variant="secondary" onPress={() => router.back()}>Back to your habits</Button>}>
            It may have been deleted.
          </EmptyState>
        )}
        {habit && (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16 }}>
              <HabitToggle size="lg" checked={habit.completed} onChange={(completed) => toggle.mutate({ id: habit.id, completed })} label={habitTitle(habit)} colour={colour} />
              <View style={{ flex: 1 }}>
                <HabitTitle habit={habit} role="heading" aria-level={1} style={{ fontSize: 24, lineHeight: 32 }} />
                {habit.habitType === 'standard' && habit.description ? <Text tone="muted" style={{ marginTop: 4 }}>{habit.description}</Text> : null}
                <Text variant="small" tone="muted" style={{ marginTop: 4 }}>
                  {habit.completed ? 'Done today' : 'Not done yet today'}
                </Text>
              </View>
            </View>

            {history.isPending && (
              <View role="status" aria-label="Loading history" style={{ gap: 16 }}>
                <Skeleton height={56} width="66%" />
                <Skeleton height={128} />
              </View>
            )}
            {history.error && !history.data && <ErrorState compact error={history.error} onRetry={() => history.refetch()} retrying={history.isFetching} />}
            {records && (
              <>
                <View style={{ flexDirection: 'row', gap: 24 }}>
                  <Stat label="Current streak" days={calculateCurrentStreak(records)} />
                  <Stat label="Longest streak" days={calculateLongestStreak(records)} />
                </View>
                <View accessibilityLabel="History" style={{ gap: 12 }}>
                  <Text variant="subheading" role="heading">
                    Last 15 weeks
                  </Text>
                  <Heatmap history={records} colour={colour} />
                </View>
              </>
            )}

            <View style={{ flexDirection: 'row', gap: 12, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 24 }}>
              <Button variant="secondary" icon={Pencil} onPress={() => setEditing(true)}>
                Edit
              </Button>
              <Button variant="ghost" icon={Trash2} onPress={() => setConfirmingDelete(true)}>
                Delete
              </Button>
            </View>
          </>
        )}
      </ScrollView>
      <HabitFormSheet open={editing} onClose={() => setEditing(false)} habit={habit ?? undefined} />
      <ConfirmDialog
        open={confirmingDelete}
        title="Delete this habit?"
        description="The habit and its history will be gone for good. This can’t be undone."
        cancelLabel="Keep habit"
        confirmLabel={deleteHabit.isPending ? 'Deleting…' : 'Delete habit'}
        busy={deleteHabit.isPending}
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={confirmDelete}
      />
    </SafeAreaView>
  )
}
