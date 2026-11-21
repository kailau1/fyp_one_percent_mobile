import { router } from 'expo-router'
import { useEffect } from 'react'
import { View } from 'react-native'
import { ErrorState } from '@/components/ErrorState'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { Text } from '@/components/ui/Text'
import { seenReflection, useLatestReflection, useReflectionHistory } from './hooks'
import { entries, formatWeekRange } from './weeks'

/**
 * The top of Insights: last week read back (written on the first visit after the week ends, which
 * takes a few seconds), and links to earlier weeks. Never retried automatically: AI quota.
 */
export function LastWeekSection() {
  const { data, error, isPending, refetch, isFetching } = useLatestReflection()
  const history = useReflectionHistory()
  const earlier = (history.data?.items ?? []).filter((week) => week.weekStart !== data?.weekStart)

  useEffect(() => {
    if (data?.status === 'ready') seenReflection.set(data.weekStart)
  }, [data])

  const open = (weekStart: string) => router.push({ pathname: '/insights/week/[weekStart]', params: { weekStart } })

  return (
    <View accessibilityLabel="Last week" style={{ gap: 12, marginBottom: 40 }}>
      <Text variant="heading" role="heading">
        Last week
      </Text>
      {isPending && (
        <Card>
          <View role="status" aria-label="Reading back your week" style={{ gap: 12 }}>
            <Text variant="small" tone="muted">
              Reading back your week…
            </Text>
            <Skeleton height={20} />
            <Skeleton height={20} width="80%" />
          </View>
        </Card>
      )}
      {error && <ErrorState compact error={error} onRetry={() => refetch()} retrying={isFetching} />}
      {data?.status === 'notEnoughEntries' && (
        <Text tone="muted">
          {data.entryCount === 0 ? 'Nothing was written' : `Only ${entries(data.entryCount)} was written`} between {formatWeekRange(data.weekStart, data.weekEnd)}.
          Write at least twice in a week and it’s read back to you here the Monday after.
        </Text>
      )}
      {data?.status === 'ready' && (
        <Card style={{ gap: 12 }}>
          <Text variant="small" tone="muted">
            {formatWeekRange(data.weekStart, data.weekEnd)}
          </Text>
          <Text serif style={{ fontSize: 18, lineHeight: 30 }}>
            {data.opening}
          </Text>
          {data.question ? <Text tone="muted">{data.question}</Text> : null}
          <Button variant="link" onPress={() => open(data.weekStart)}>
            Read your week
          </Button>
        </Card>
      )}
      {earlier.length > 0 && (
        <View accessibilityLabel="Earlier weeks" style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 16, rowGap: 4 }}>
          <Text variant="small" tone="muted">
            Earlier:
          </Text>
          {earlier.map((week) => (
            <Button key={week.weekStart} variant="link" size="sm" onPress={() => open(week.weekStart)}>
              {formatWeekRange(week.weekStart, week.weekEnd)}
            </Button>
          ))}
        </View>
      )}
    </View>
  )
}
