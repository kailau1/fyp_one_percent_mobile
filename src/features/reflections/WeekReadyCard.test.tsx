import { screen } from '@testing-library/react-native'
import { renderWithProviders } from '@/test/render'
import { seenReflection } from './hooks'
import { WeekReadyCard } from './WeekReadyCard'

// On its own (not after whole-app tests), so no router state from them leaks in.
describe('the week-ready card on Today', () => {
  it('points to last week from Monday to Wednesday, until it has been seen', async () => {
    const wednesday = new Date(2026, 10, 18, 9) // last week: 9–15 November
    const days = ['2026-11-10', '2026-11-12']

    const view = await renderWithProviders(<WeekReadyCard entryDays={days} now={wednesday} />)
    expect(screen.getByRole('button', { name: 'Read last week' })).toBeOnTheScreen()
    view.unmount()

    seenReflection.set('2026-11-09')
    await renderWithProviders(<WeekReadyCard entryDays={days} now={wednesday} />)
    expect(screen.queryByRole('button', { name: 'Read last week' })).toBeNull()
  })

  it('stays away later in the week, or if last week had entries on fewer than two days', async () => {
    const view = await renderWithProviders(<WeekReadyCard entryDays={['2026-11-10', '2026-11-12']} now={new Date(2026, 10, 19, 9)} />)
    expect(screen.queryByRole('button', { name: 'Read last week' })).toBeNull()
    view.unmount()

    await renderWithProviders(<WeekReadyCard entryDays={['2026-11-10', '2026-11-18']} now={new Date(2026, 10, 18, 9)} />)
    expect(screen.queryByRole('button', { name: 'Read last week' })).toBeNull()
  })
})
