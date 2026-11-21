import { router } from 'expo-router'
import { Sparkles } from 'lucide-react-native'
import { View } from 'react-native'
import { ErrorState } from '@/components/ErrorState'
import { Markdown } from '@/components/Markdown'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { Text } from '@/components/ui/Text'
import { useTheme } from '@/theme/ThemeProvider'

interface FeedbackPanelProps {
  /** The feedback (markdown), if the entry has any. */
  feedback?: string | null
  isPending: boolean
  error: unknown
  onRequest: () => void
  /** Nothing has been written yet, so there is nothing to give feedback on. */
  nothingToReview: boolean
  /** The entry has unsaved changes (or isn't saved at all), so asking will save it first. */
  needsSave: boolean
}

/**
 * AI feedback on the open entry, under the writing on a phone (beside it on the web).
 * A failed request shows an error here and is never stored as if it were feedback.
 */
export function FeedbackPanel({ feedback, isPending, error, onRequest, nothingToReview, needsSave }: FeedbackPanelProps) {
  const { colors } = useTheme()
  const hasFeedback = Boolean(feedback?.trim())
  const askLabel = needsSave ? 'Save and get feedback' : hasFeedback ? 'Get fresh feedback' : 'Get feedback'

  return (
    <Card>
      <View role="region" aria-label="Feedback">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Sparkles size={16} color={colors.sunrise} />
          <Text variant="subheading" role="heading">
            Feedback
          </Text>
        </View>

        {isPending ? (
          <View role="status" style={{ gap: 10 }}>
            <Text variant="small" tone="muted">
              Reading your entry. This can take a little while.
            </Text>
            <Skeleton />
            <Skeleton width="92%" />
            <Skeleton width="80%" />
          </View>
        ) : (
          <>
            {Boolean(error) && <ErrorState compact error={error} onRetry={onRequest} style={{ marginBottom: 16 }} />}
            {hasFeedback ? (
              <Markdown>{feedback!}</Markdown>
            ) : (
              !error && (
                <Text tone="muted" style={{ fontSize: 15, lineHeight: 28 }}>
                  Get a short, personal reflection on this entry. It takes your habits and what you’ve written before into account.
                </Text>
              )
            )}
            {!error && (
              <Button variant={hasFeedback ? 'secondary' : 'primary'} size="sm" onPress={onRequest} disabled={nothingToReview} style={{ marginTop: 16 }}>
                {askLabel}
              </Button>
            )}
            {nothingToReview && (
              <Text variant="small" tone="muted" style={{ marginTop: 8 }}>
                Write something first.
              </Text>
            )}
            <Button variant="link" size="sm" onPress={() => router.push('/about-you')} style={{ marginTop: 16 }}>
              What the AI knows about you
            </Button>
          </>
        )}
      </View>
    </Card>
  )
}
