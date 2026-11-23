import { EmptyState } from '../EmptyState'
import { Screen } from './Screen'

/** A tab that the new app hasn't rebuilt yet. Replaced screen by screen as the rebuild goes on. */
export function ComingSoon({ title }: { title: string }) {
  return (
    <Screen title={title}>
      <EmptyState title="Coming in the new app">This screen is being rebuilt to match the web app.</EmptyState>
    </Screen>
  )
}
