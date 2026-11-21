import { addDays } from 'date-fns'
import { router } from 'expo-router'
import { View } from 'react-native'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Text } from '@/components/ui/Text'
import { seenReflection } from './hooks'
import { lastWeekStart, parseDay } from './weeks'

/**
 * On Today, Monday to Wednesday: a quiet pointer to last week's reflection until it's been seen.
 * It asks the server nothing (opening Today must never spend AI quota); it only shows if the entry
 * calendar Today already loads says there were entries on at least two days last week.
 */
export function WeekReadyCard({ entryDays, now }: { entryDays: string[] | undefined; now: Date }) {
  const day = now.getDay() // 0 Sunday … 6 Saturday
  if (day < 1 || day > 3 || !entryDays) return null
  const weekStart = lastWeekStart(now)
  if (seenReflection.get() === weekStart) return null
  const start = parseDay(weekStart)
  const end = addDays(start, 7)
  const daysWithEntries = entryDays.filter((d) => {
    const date = parseDay(d)
    return date >= start && date < end
  }).length
  if (daysWithEntries < 2) return null

  return (
    <Card style={{ paddingVertical: 16 }}>
      <View accessibilityLabel="Last week" style={{ gap: 4 }}>
        <Text>Your week, read back to you, is ready.</Text>
        <Button variant="link" onPress={() => router.navigate('/insights')}>
          Read last week
        </Button>
      </View>
    </Card>
  )
}
