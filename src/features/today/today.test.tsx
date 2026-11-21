import { fireEvent, screen, waitFor } from '@testing-library/react-native'
import { format } from 'date-fns'
import { http, HttpResponse } from 'msw'
import { renderApp } from '@/test/app'
import { signIn } from '@/test/auth'
import { db, dayKey } from '@/test/msw/db'
import { API, server } from '@/test/msw/server'

beforeEach(() => {
  signIn()
  // entries dated relative to now, so "this year" and "today" always line up with the app
  db.journals = [
    { id: 'j1', title: 'Two days ago', content: 'x', llmResponse: null, createdAt: `${dayKey(2)}T08:00:00Z` },
    { id: 'j2', title: 'Last week', content: 'y', llmResponse: null, createdAt: `${dayKey(8)}T20:00:00Z` },
  ]
})

describe('Today', () => {
  it("shows today's date and greets the user by name", async () => {
    await renderApp('/')

    expect(await screen.findByRole('heading', { name: format(new Date(), 'EEEE d MMMM') })).toBeOnTheScreen()
    expect(screen.getByText(/, Kai$/)).toBeOnTheScreen()
  })

  it('counts the days you showed up this year and what they compound to', async () => {
    // default habit history: h1 on days 1,2,3,6 ago; h2 today + yesterday; entries 2 and 8 days ago
    await renderApp('/')
    const days = [0, 1, 2, 3, 6, 8].filter((n) => dayKey(n).startsWith(String(new Date().getFullYear()))).length

    expect(await screen.findByRole('image', { name: new RegExp(`^You showed up on ${days} of \\d+ days so far this year$`) })).toBeOnTheScreen()
    expect(screen.getByText(new RegExp(`shown up on ${days} days? this year.*${Math.pow(1.01, days).toFixed(2)}×`))).toBeOnTheScreen()
  })

  it('invites a first mark when nothing has been done yet', async () => {
    db.journals = []
    db.history = []
    db.habits = db.habits.map((h) => ({ ...h, completed: false }))
    await renderApp('/')

    expect(await screen.findByText(/Every mark is a day/)).toBeOnTheScreen()
  })

  it("lists today's habits and ticks one off", async () => {
    db.habits = db.habits.map((h) => ({ ...h, completed: false }))
    await renderApp('/')
    expect(await screen.findByText('0 of 3 done')).toBeOnTheScreen()

    await fireEvent.press(screen.getByRole('checkbox', { name: 'Read 10 pages: done today' }))

    expect(await screen.findByText('1 of 3 done')).toBeOnTheScreen()
    await waitFor(() => expect(db.habits.find((h) => h.id === 'h1')!.completed).toBe(true))
  })

  it("offers to write today's entry, or continue it if one exists", async () => {
    const result = await renderApp('/')
    await fireEvent.press(await screen.findByRole('button', { name: 'Write today’s entry' }))
    await waitFor(() => expect(result.getPathname()).toBe('/journal/new'))
  })

  it('continues the entry already written today', async () => {
    db.journals = [{ id: 'jt', title: 'This morning', content: 'x', llmResponse: null, createdAt: new Date().toISOString() }]
    const result = await renderApp('/')
    await fireEvent.press(await screen.findByRole('button', { name: 'Continue today’s entry' }))
    await waitFor(() => expect(result.getPathname()).toBe('/journal/jt'))
  })

  it('links to recent entries, newest first', async () => {
    await renderApp('/')
    await screen.findByRole('link', { name: 'Two days ago' })

    expect(screen.getAllByRole('link').map((link) => link.props.accessibilityLabel)).toEqual(['Two days ago', 'Last week'])
  })

  it('shows one banner and one retry for the whole screen when the server is unreachable', async () => {
    for (const path of ['/api/habits/me', '/api/journals', '/api/journals/days', '/api/habit-history']) {
      server.use(http.get(`${API}${path}`, () => HttpResponse.error()))
    }
    await renderApp('/')

    expect(await screen.findByRole('button', { name: 'Try again' }, { timeout: 5000 })).toBeOnTheScreen()
    expect(screen.getAllByRole('button', { name: 'Try again' })).toHaveLength(1)
  })

  it("shows the tip of the day, and remembers today's so reopening doesn't ask again", async () => {
    let requests = 0
    server.use(
      http.get(`${API}/api/ai/tip`, () => {
        requests++
        return HttpResponse.json({ response: db.tip })
      }),
    )
    const first = await renderApp('/')
    expect(await screen.findByText(db.tip)).toBeOnTheScreen()
    first.unmount()

    await renderApp('/')
    expect(await screen.findByText(db.tip)).toBeOnTheScreen()
    expect(requests).toBe(1)
  })
})
