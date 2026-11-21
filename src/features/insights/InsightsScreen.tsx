import { router } from 'expo-router'
import { Pressable, View } from 'react-native'
import type { ThemeInsights } from '@/api/types'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Screen } from '@/components/layout/Screen'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { Text } from '@/components/ui/Text'
import { themeLabel } from '@/features/journal/themes'
import { LastWeekSection } from '@/features/reflections/LastWeekSection'
import { formatDay, parseDateTime } from '@/lib/dates'
import { useTheme } from '@/theme/ThemeProvider'
import { radius } from '@/theme/tokens'
import { useThemeInsights } from './hooks'
import { MonthBars } from './MonthBars'
import { trendLabel } from './trend'

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

function ThemeList({ insights }: { insights: ThemeInsights }) {
  const { colors } = useTheme()
  const { analysedEntries, totalEntries, themes, months } = insights
  const skipped = totalEntries - analysedEntries

  return (
    <View>
      <Text tone="muted">
        What your journal keeps coming back to, across {plural(analysedEntries, 'entry', 'entries')}.
        {skipped > 0 && ` ${plural(skipped, 'entry was', 'entries were')} saved while AI analysis was unavailable, so ${skipped === 1 ? 'it isn’t' : 'they aren’t'} included.`}
      </Text>

      <View accessibilityLabel="Themes" style={{ marginTop: 16 }}>
        {themes.map((theme, index) => {
          const counts = months && theme.monthlyCounts?.length === months.length ? theme.monthlyCounts : null
          const label = counts ? trendLabel(counts, index < 3) : null
          return (
            <View key={theme.name} style={{ paddingVertical: 20, borderBottomWidth: index < themes.length - 1 ? 1 : 0, borderBottomColor: colors.line, gap: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 12, rowGap: 4 }}>
                    <Text variant="subheading" role="heading">
                      {themeLabel(theme.name)}
                    </Text>
                    <Text tone="muted">in {plural(theme.entryCount, 'entry', 'entries')}</Text>
                  </View>
                  {label && (
                    <View style={{ alignSelf: 'flex-start', borderRadius: radius.full, backgroundColor: colors.skyWash, paddingHorizontal: 10, paddingVertical: 2 }}>
                      <Text variant="small">{label}</Text>
                    </View>
                  )}
                </View>
                {counts && months && <MonthBars months={months} counts={counts} name={themeLabel(theme.name)} />}
              </View>
              {theme.recentEntries.length > 0 && (
                <View accessibilityLabel={`Recent entries about ${theme.name}`} style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 6 }}>
                  {theme.recentEntries.map((entry) => {
                    const written = parseDateTime(entry.createdAt)
                    const title = entry.title?.trim() || 'Untitled'
                    return (
                      <Pressable key={entry.id} accessibilityRole="link" accessibilityLabel={title} onPress={() => router.push({ pathname: '/journal/[id]', params: { id: entry.id } })} hitSlop={6}>
                        <Text variant="small">
                          <Text variant="small" tone="action">
                            {title}
                          </Text>
                          {written ? <Text variant="small" tone="muted">{` · ${formatDay(written)}`}</Text> : null}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
              )}
            </View>
          )
        })}
      </View>

      <Text variant="small" tone="muted" style={{ marginTop: 24 }}>
        Entries are tagged with the themes they’re clearly about: none, one, or a few. You can change an entry’s themes when you open it.
      </Text>
    </View>
  )
}

/** Insights: last week read back, and the themes your journal keeps coming back to. */
export function InsightsScreen() {
  const { data, error, isPending, refetch, isFetching } = useThemeInsights()
  return (
    <Screen title="Insights" onRefresh={() => refetch()} refreshing={isFetching && !isPending}>
      {/* only once there's something to read back: no AI request for someone who hasn't written yet */}
      {data && data.totalEntries > 0 && <LastWeekSection />}
      {isPending && (
        <View role="status" aria-label="Loading insights" style={{ gap: 24 }}>
          <Skeleton height={20} width="80%" />
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ gap: 10 }}>
              <Skeleton height={24} width="50%" />
              <Skeleton height={16} width="66%" />
            </View>
          ))}
        </View>
      )}
      {error && <ErrorState compact={Boolean(data)} error={error} onRetry={() => refetch()} retrying={isFetching} style={{ marginBottom: 24 }} />}
      {data && data.totalEntries === 0 && (
        <EmptyState title="No themes yet" action={<Button onPress={() => router.push('/journal/new')}>Write an entry</Button>}>
          Once you’ve written a few entries, the themes you keep returning to will show up here.
        </EmptyState>
      )}
      {data && data.totalEntries > 0 && data.analysedEntries === 0 && (
        <EmptyState title="Your entries haven’t been analysed yet">
          Themes come from AI analysis, which wasn’t available when these entries were saved. New entries, and entries you edit, are analysed as they’re saved.
        </EmptyState>
      )}
      {data && data.analysedEntries > 0 && <ThemeList insights={data} />}
    </Screen>
  )
}
