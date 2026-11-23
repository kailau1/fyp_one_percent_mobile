import { router, useLocalSearchParams } from 'expo-router'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { toApiError } from '@/api/client'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { useTheme } from '@/theme/ThemeProvider'
import { gutter } from '@/theme/tokens'
import { EntryEditor } from './components/EntryEditor'
import { useEntry } from './hooks'

/** /journal/:id: one entry, open for reading and editing. */
export function EntryScreen() {
  const { colors } = useTheme()
  const { id, requestFeedback } = useLocalSearchParams<{ id: string; requestFeedback?: string }>()
  const { data: entry, isPending, error, refetch, isFetching } = useEntry(id)

  if (entry) {
    // `key` gives each entry its own editor state, so switching entries never mixes their text.
    return <EntryEditor key={entry.id} entry={entry} requestFeedbackOnOpen={requestFeedback === '1'} />
  }
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
      <View style={{ padding: gutter, paddingTop: 64, gap: 16 }}>
        {isPending ? (
          <View role="status" aria-label="Loading entry" style={{ gap: 16 }}>
            <Skeleton width="66%" height={36} />
            <Skeleton />
            <Skeleton />
            <Skeleton width="80%" />
          </View>
        ) : toApiError(error).kind === 'notFound' ? (
          <EmptyState
            title="This entry doesn’t exist"
            action={
              <Button variant="secondary" onPress={() => router.back()}>
                Back to your journal
              </Button>
            }
          >
            It may have been deleted.
          </EmptyState>
        ) : (
          <ErrorState error={error} onRetry={() => refetch()} retrying={isFetching} />
        )}
      </View>
    </SafeAreaView>
  )
}

/** /journal/new: a blank page, optionally with a question to answer (?prompt=…). */
export function NewEntryScreen() {
  const { prompt } = useLocalSearchParams<{ prompt?: string }>()
  // keyed by the prompt, so a question arriving after the first render still becomes the title
  return <EntryEditor key={prompt ?? 'blank'} prompt={prompt} />
}
