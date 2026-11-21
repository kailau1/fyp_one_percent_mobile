import { fireEvent, screen, waitFor } from '@testing-library/react-native'
import { http, HttpResponse } from 'msw'
import { renderApp } from '@/test/app'
import { signIn } from '@/test/auth'
import { db } from '@/test/msw/db'
import { API, server } from '@/test/msw/server'

beforeEach(() => {
  signIn()
})

describe('insights', () => {
  it('lists themes, most common first, with how many entries touch each', async () => {
    await renderApp('/insights')

    expect(await screen.findByRole('heading', { name: 'Procrastination' })).toBeOnTheScreen()
    const headings = screen.getAllByRole('heading').map((h) => h.props.children)
    expect(headings.indexOf('Procrastination')).toBeLessThan(headings.indexOf('Self-doubt'))
    expect(screen.getByText('in 2 entries')).toBeOnTheScreen()
    expect(screen.getByText('in 1 entry')).toBeOnTheScreen()
  })

  it('shows how often each theme came up in each of the last six months', async () => {
    db.insights.themes[0].monthlyCounts = [0, 1, 0, 0, 4, 1]
    await renderApp('/insights')

    expect(await screen.findByRole('image', { name: 'Procrastination by month: Most in October: 4 entries.' })).toBeOnTheScreen()
  })

  it('points out a clear rise this month', async () => {
    db.insights.themes[0].monthlyCounts = [0, 1, 0, 1, 1, 3]
    await renderApp('/insights')
    expect(await screen.findByText('More this month')).toBeOnTheScreen()
  })

  it('links each theme to its recent entries', async () => {
    const result = await renderApp('/insights')
    await fireEvent.press((await screen.findAllByRole('link', { name: 'A slow start' }))[0])
    await waitFor(() => expect(result.getPathname()).toBe('/journal/j1'))
  })

  it('invites a first entry when there are none, without asking for a reflection', async () => {
    let asked = false
    server.use(
      http.get(`${API}/api/reflections/latest`, () => {
        asked = true
        return HttpResponse.json(db.latestReflection)
      }),
    )
    db.insights = { totalEntries: 0, analysedEntries: 0, themes: [] }
    await renderApp('/insights')

    expect(await screen.findByText('No themes yet')).toBeOnTheScreen()
    expect(asked).toBe(false)
  })

  it("shows a retry when the server can't be reached", async () => {
    server.use(http.get(`${API}/api/insights/themes`, () => HttpResponse.error()))
    await renderApp('/insights')
    expect(await screen.findByRole('button', { name: 'Try again' }, { timeout: 5000 })).toBeOnTheScreen()
  })
})

describe('weekly reflection', () => {
  it("opens Insights with last week's reflection, and links to the full week", async () => {
    const result = await renderApp('/insights')

    expect(await screen.findByText(/A week of starting late/)).toBeOnTheScreen()
    expect(screen.getByText('9–15 November')).toBeOnTheScreen()
    await fireEvent.press(screen.getByRole('button', { name: 'Read your week' }))
    await waitFor(() => expect(result.getPathname()).toBe('/insights/week/2026-11-09'))
  })

  it('says what is needed when last week had too few entries', async () => {
    db.latestReflection = { status: 'notEnoughEntries', weekStart: '2026-11-09', weekEnd: '2026-11-15', entryCount: 1 }
    db.reflections = []
    await renderApp('/insights')
    expect(await screen.findByText(/Only 1 entry was written between 9–15 November/)).toBeOnTheScreen()
  })

  it("shows the server's reason with a retry if the AI couldn't write it, and doesn't retry by itself", async () => {
    let requests = 0
    server.use(
      http.get(`${API}/api/reflections/latest`, () => {
        requests++
        return new HttpResponse('Your weekly reflection couldn’t be written just now. Try again in a minute.', { status: 503 })
      }),
    )
    await renderApp('/insights')

    expect(await screen.findByText(/couldn’t be written just now/)).toBeOnTheScreen()
    expect(requests).toBe(1)
  })

  it('shows the full week: words, quotes, numbers and the question', async () => {
    await renderApp('/insights/week/2026-11-09')

    expect(await screen.findByRole('heading', { name: 'Your week: 9–15 November' })).toBeOnTheScreen()
    expect(await screen.findByText('“I kept putting off the report today”')).toBeOnTheScreen()
    expect(screen.getByText('4 entries on 3 days')).toBeOnTheScreen()
    expect(screen.getByText('3 entries · more than usual (2 entries in the four weeks before)')).toBeOnTheScreen()
    expect(screen.getByText('3 of 7 days')).toBeOnTheScreen()
  })

  it('"Write about this" starts a new entry with the question as its title', async () => {
    await renderApp('/insights/week/2026-11-09')
    await fireEvent.press(await screen.findByRole('button', { name: 'Write about this' }))

    expect(await screen.findByLabelText('Title', { exact: true })).toHaveDisplayValue('What made the report feel bigger than it was?')
  })

  it('says so for a week that was never read back', async () => {
    await renderApp('/insights/week/2026-10-05')
    expect(await screen.findByText('No reflection for this week')).toBeOnTheScreen()
  })
})
