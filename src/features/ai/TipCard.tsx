import { View } from 'react-native'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { Text } from '@/components/ui/Text'
import { useTipOfTheDay } from './hooks'

/**
 * Today's tip. Asked for once a day and remembered until tomorrow.
 * `quietErrors`: the screen is already showing one error banner for everything, so don't add another.
 */
export function TipCard({ quietErrors = false }: { quietErrors?: boolean }) {
  const { data: tip, error, isPending, isFetching, refetch } = useTipOfTheDay()
  return (
    <View accessibilityLabel="Tip of the day" style={{ gap: 12 }}>
      <Text variant="heading" role="heading">
        Tip of the day
      </Text>
      {isPending && (
        <View role="status" aria-label="Loading tip" style={{ gap: 10 }}>
          <Skeleton height={20} />
          <Skeleton height={20} width="75%" />
        </View>
      )}
      {Boolean(error) && !tip && quietErrors && <Text tone="muted">Not loaded.</Text>}
      {Boolean(error) && !tip && !quietErrors && <ErrorState compact error={error} onRetry={() => refetch()} retrying={isFetching} />}
      {tip && (
        <Text serif style={{ fontSize: 20, lineHeight: 32 }}>
          {tip}
        </Text>
      )}
    </View>
  )
}
