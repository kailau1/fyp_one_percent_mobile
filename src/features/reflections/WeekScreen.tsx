import { addDays, format } from 'date-fns'
import { router, useLocalSearchParams } from 'expo-router'
import { ArrowLeft, PenLine } from 'lucide-react-native'
import { useEffect } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ApiError } from '@/api/client'
import type { WeeklyReflection } from '@/api/types'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { Text } from '@/components/ui/Text'
import { themeLabel } from '@/features/journal/themes'
import { useTheme } from '@/theme/ThemeProvider'
import { gutter } from '@/theme/tokens'
import { seenReflection, useReflection } from './hooks'
import { entries, formatWeekRange, parseDay, themeComparison } from './weeks'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View accessibilityLabel={title} style={{ marginTop: 40, gap: 12 }}>
      <Text variant="heading" role="heading">
        {title}
      </Text>
      {children}
    </View>
  )
}

/** A ready reflection: the AI's words, the user's own words, the numbers, and a question to take on. */
function ReflectionView({ reflection }: { reflection: WeeklyReflection }) {
  const { colors } = useTheme()
  const { opening, quotes = [], themes = [], habits = [], question, entryCount, daysWritten = 0 } = reflection
  const rowStyle = { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line }

  return (
    <View>
      <Text variant="small" tone="muted" style={{ marginBottom: 8 }}>
        {entries(entryCount)} on {daysWritten} {daysWritten === 1 ? 'day' : 'days'}
      </Text>
      <Text serif style={{ fontSize: 20, lineHeight: 36 }}>
        {opening}
      </Text>

      {quotes.length > 0 && (
        <Section title="In your words">
          {quotes.map((quote) => (
            <View key={quote.entryId + quote.text} style={{ gap: 4 }}>
              <View style={{ borderLeftWidth: 2, borderLeftColor: colors.sky, paddingLeft: 16 }}>
                <Text serif style={{ fontSize: 18, lineHeight: 32 }}>{`“${quote.text}”`}</Text>
              </View>
              <Button variant="link" size="sm" onPress={() => router.push({ pathname: '/journal/[id]', params: { id: quote.entryId } })} style={{ marginLeft: 18 }}>
                {`From ${quote.entryTitle?.trim() || 'an untitled entry'}`}
              </Button>
            </View>
          ))}
        </Section>
      )}

      {themes.length > 0 && (
        <Section title="What came up">
          {themes.map((theme) => (
            <View key={theme.name} style={[rowStyle, { gap: 2 }]}>
              <Text>{themeLabel(theme.name)}</Text>
              <Text variant="small" tone="muted">
                {`${entries(theme.thisWeek)} · ${themeComparison(theme.thisWeek, theme.previousFourWeeks)}`}
              </Text>
            </View>
          ))}
        </Section>
      )}

      {habits.length > 0 && (
        <Section title="Habits">
          {habits.map((habit) => (
            <View key={habit.name} style={[rowStyle, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: habit.colour }} />
              <Text numberOfLines={1} style={{ flex: 1 }}>
                {habit.name}
              </Text>
              <View style={{ flexDirection: 'row', gap: 4 }} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
                {Array.from({ length: 7 }, (_, i) => (
                  <View key={i} style={{ width: 9, height: 9, borderRadius: 3, backgroundColor: i < habit.daysDone ? colors.sunrise : colors.sunken }} />
                ))}
              </View>
              <Text variant="small" tone="muted" style={{ width: 72, textAlign: 'right' }}>
                {habit.daysDone} of 7 days
              </Text>
            </View>
          ))}
        </Section>
      )}

      {question ? (
        <Card style={{ marginTop: 40, gap: 8 }}>
          <View accessibilityLabel="To carry into this week" style={{ gap: 8 }}>
            <Text variant="small" weight="medium" tone="muted" role="heading">
              To carry into this week
            </Text>
            <Text serif style={{ fontSize: 20, lineHeight: 32 }}>
              {question}
            </Text>
            <Button icon={PenLine} onPress={() => router.push({ pathname: '/journal/new', params: { prompt: question } })} style={{ marginTop: 12 }}>
              Write about this
            </Button>
          </View>
        </Card>
      ) : null}

      <Text variant="small" tone="muted" style={{ marginTop: 32 }}>
        Written by AI from your entries; the quotes are your own words. The numbers are counted, not guessed.
      </Text>
    </View>
  )
}

/** /insights/week/:weekStart: one week read back, in full. */
export function WeekScreen() {
  const { colors } = useTheme()
  const { weekStart = '' } = useLocalSearchParams<{ weekStart: string }>()
  const { data, error, isPending, refetch, isFetching } = useReflection(weekStart)
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(weekStart)
  const title = valid ? `Your week: ${formatWeekRange(weekStart, format(addDays(parseDay(weekStart), 6), 'yyyy-MM-dd'))}` : 'Your week'
  const notFound = error instanceof ApiError && (error.kind === 'notFound' || error.kind === 'badRequest')

  useEffect(() => {
    if (data?.status === 'ready') seenReflection.set(data.weekStart)
  }, [data])

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.paper }}>
      <View style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Insights" hitSlop={10} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={22} color={colors.ink} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 48 }}>
        <Text variant="title" role="heading" aria-level={1} style={{ marginBottom: 24 }}>
          {title}
        </Text>
        {isPending && (
          <View role="status" aria-label="Loading your week" style={{ gap: 12 }}>
            <Skeleton height={24} />
            <Skeleton height={24} width="85%" />
            <Skeleton height={24} width="66%" />
          </View>
        )}
        {notFound && <EmptyState title="No reflection for this week">A week is read back the first time you open Insights after it ends, if you wrote at least twice.</EmptyState>}
        {error && !notFound && <ErrorState error={error} onRetry={() => refetch()} retrying={isFetching} />}
        {data?.status === 'ready' && <ReflectionView reflection={data} />}
      </ScrollView>
    </SafeAreaView>
  )
}
