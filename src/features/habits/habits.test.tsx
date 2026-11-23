import { fireEvent, screen, waitFor } from '@testing-library/react-native'
import { http, HttpResponse } from 'msw'
import { renderApp } from '@/test/app'
import { signIn } from '@/test/auth'
import { db } from '@/test/msw/db'
import { API, server } from '@/test/msw/server'

beforeEach(() => {
  signIn()
})

const tick = (title: string) => screen.findByRole('checkbox', { name: `${title}: done today` })
const listed = () => screen.findByText(/done today|All \d+ done today/)

describe('habit list', () => {
  it('shows each habit, with trigger → action habits as a sentence', async () => {
    await renderApp('/habits')
    await listed()

    expect(screen.getByText('Read 10 pages')).toBeOnTheScreen()
    expect(screen.getByText('Before bed')).toBeOnTheScreen()
    expect(await tick('When I pour my coffee, I will write one line')).toBeOnTheScreen()
  })

  it('shows trigger → action habits saved with capitals in lower case', async () => {
    Object.assign(db.habits.find((h) => h.id === 'h3')!, { trigger: 'Pour My Coffee', action: 'Write One Line' })
    await renderApp('/habits')

    expect(await tick('When I pour my coffee, I will write one line')).toBeOnTheScreen()
  })

  it('shows what is done today and overall progress', async () => {
    await renderApp('/habits')

    expect(await tick('Morning run')).toBeChecked()
    expect(await tick('Read 10 pages')).not.toBeChecked()
    expect(screen.getByText('1 of 3 done today')).toBeOnTheScreen()
    expect(screen.getByRole('progressbar', { name: 'Habits done today' })).toHaveAccessibilityValue({ now: 1, max: 3 })
  })

  it('shows current streaks, keeping one alive when today is not done yet', async () => {
    await renderApp('/habits')

    // h1: done the previous three days, not yet today; h2: today and yesterday
    expect(await screen.findByText('3 days')).toBeOnTheScreen()
    expect(screen.getByText('2 days')).toBeOnTheScreen()
  })

  it('invites a first habit when there are none', async () => {
    db.habits = []
    await renderApp('/habits')

    expect(await screen.findByText('No habits yet')).toBeOnTheScreen()
    expect(screen.getByRole('button', { name: 'Add your first habit' })).toBeOnTheScreen()
  })

  it("shows a retry when the server can't be reached, not an empty list", async () => {
    server.use(http.get(`${API}/api/habits/me`, () => HttpResponse.error()))
    await renderApp('/habits')

    expect(await screen.findByRole('button', { name: 'Try again' }, { timeout: 5000 })).toBeOnTheScreen()
    expect(screen.queryByText('No habits yet')).toBeNull()
  })

  it('says so, with a retry, when streak history fails to load', async () => {
    server.use(http.get(`${API}/api/habit-history`, () => HttpResponse.error()))
    await renderApp('/habits')

    await listed()
    expect(await screen.findByRole('button', { name: 'Try again' }, { timeout: 5000 })).toBeOnTheScreen()
  })
})

describe('ticking a habit', () => {
  it('ticks it off, saves it and extends the streak straight away', async () => {
    await renderApp('/habits')
    await fireEvent.press(await tick('Read 10 pages'))

    await waitFor(async () => expect(await tick('Read 10 pages')).toBeChecked())
    expect(await screen.findByText('4 days')).toBeOnTheScreen()
    expect(screen.getByText('2 of 3 done today')).toBeOnTheScreen()
    await waitFor(() => expect(db.habits.find((h) => h.id === 'h1')!.completed).toBe(true))
  })

  it('un-ticks a habit', async () => {
    await renderApp('/habits')
    await fireEvent.press(await tick('Morning run'))

    await waitFor(() => expect(db.habits.find((h) => h.id === 'h2')!.completed).toBe(false))
    expect(await tick('Morning run')).not.toBeChecked()
  })

  it('rolls the tick back and says why when the server is unreachable', async () => {
    server.use(http.post(`${API}/api/habit-history/complete/:id`, () => HttpResponse.error()))
    await renderApp('/habits')
    await fireEvent.press(await tick('Read 10 pages'))

    expect(await screen.findByText(/Can't reach the One Percent server/)).toBeOnTheScreen()
    await waitFor(async () => expect(await tick('Read 10 pages')).not.toBeChecked())
  })
})

describe('adding and editing habits', () => {
  it('adds a simple habit', async () => {
    await renderApp('/habits')
    await fireEvent.press(await screen.findByRole('button', { name: 'New habit' }))
    await fireEvent.changeText(await screen.findByLabelText('Habit'), 'Stretch')
    await fireEvent.press(screen.getByRole('radio', { name: 'Green' }))
    await fireEvent.press(screen.getByRole('button', { name: 'Add habit' }))

    expect(await tick('Stretch')).toBeOnTheScreen()
    expect(db.habits.at(-1)).toMatchObject({ habitName: 'Stretch', colour: '#B4E197', habitType: 'standard' })
  })

  it('adds a "when → then" habit, validating both halves and keeping it lower case', async () => {
    await renderApp('/habits')
    await fireEvent.press(await screen.findByRole('button', { name: 'New habit' }))
    await fireEvent.press(await screen.findByRole('radio', { name: 'When → then' }))
    await fireEvent.press(screen.getByRole('button', { name: 'Add habit' }))

    expect(await screen.findByText('Say what sets it off')).toBeOnTheScreen()
    expect(screen.getByText('Say what you’ll do')).toBeOnTheScreen()

    await fireEvent.changeText(screen.getByLabelText('When I…'), 'Brush My Teeth')
    await fireEvent.changeText(screen.getByLabelText('I will…'), 'Floss')
    expect(screen.getByLabelText('When I…')).toHaveDisplayValue('brush my teeth')
    await fireEvent.press(screen.getByRole('button', { name: 'Add habit' }))

    expect(await tick('When I brush my teeth, I will floss')).toBeOnTheScreen()
    expect(db.habits.at(-1)).toMatchObject({ habitType: 'trigger-action', trigger: 'brush my teeth', action: 'floss' })
  })

  it('keeps the form open with the error when saving fails', async () => {
    server.use(http.post(`${API}/api/habits/create`, () => new HttpResponse(null, { status: 500 })))
    await renderApp('/habits')
    await fireEvent.press(await screen.findByRole('button', { name: 'New habit' }))
    await fireEvent.changeText(await screen.findByLabelText('Habit'), 'Stretch')
    await fireEvent.press(screen.getByRole('button', { name: 'Add habit' }))

    expect(await screen.findByText(/went wrong on the server/i)).toBeOnTheScreen()
    expect(screen.getByLabelText('Habit')).toHaveDisplayValue('Stretch')
  })
})

describe('habit details', () => {
  it('shows current and longest streaks and the history', async () => {
    await renderApp('/habits/h1')

    expect(await screen.findByText('Current streak')).toBeOnTheScreen()
    expect(screen.getByText('Longest streak')).toBeOnTheScreen()
    expect(screen.getByText(/Done on 4 of the last \d+ days/)).toBeOnTheScreen()
  })

  it('edits a habit without changing whether it is done today', async () => {
    await renderApp('/habits/h2')
    await fireEvent.press(await screen.findByRole('button', { name: 'Edit' }))
    await fireEvent.changeText(await screen.findByLabelText('Habit'), 'Evening run')
    await fireEvent.press(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(db.habits.find((h) => h.id === 'h2')).toMatchObject({ habitName: 'Evening run', completed: true }))
  })

  it('deletes a habit after confirming', async () => {
    await renderApp('/habits')
    await fireEvent.press(await screen.findByRole('button', { name: /^Read 10 pages, streak 3 days, open details$/ }))
    await fireEvent.press(await screen.findByRole('button', { name: 'Delete' }))
    expect(await screen.findByText('Delete this habit?')).toBeOnTheScreen()
    await fireEvent.press(screen.getByRole('button', { name: 'Delete habit' }))

    expect(await screen.findByText('Habit deleted')).toBeOnTheScreen()
    expect(db.habits.some((h) => h.id === 'h1')).toBe(false)
  })
})
