import { fireEvent, screen, waitFor } from '@testing-library/react-native'
import { http, HttpResponse } from 'msw'
import { renderApp } from '@/test/app'
import { signIn } from '@/test/auth'
import { db } from '@/test/msw/db'
import { API, server } from '@/test/msw/server'

beforeEach(() => {
  signIn()
})

const fact = (text: string) => screen.findByText(text)
async function openPreview() {
  await fireEvent.press(await screen.findByRole('button', { name: 'Exactly what’s sent' }))
  return screen.getByLabelText('Context sent to the AI')
}

describe('what One Percent knows about you', () => {
  it('is linked from Account, and shows each kind of context and exactly what is sent', async () => {
    const result = await renderApp('/account')
    await fireEvent.press(await screen.findByRole('button', { name: 'Open' }))
    await waitFor(() => expect(result.getPathname()).toBe('/about-you'))

    expect(await fact('I work night shifts')).toBeOnTheScreen()
    expect(screen.getByText('Read 10 pages')).toBeOnTheScreen()
    expect(screen.getByText('Self-doubt')).toBeOnTheScreen()
    expect((await openPreview()).props.children).toContain('often writes about: procrastination, self-doubt')
  })

  it('adds a fact, which then appears in what is sent', async () => {
    await renderApp('/about-you')
    await fireEvent.changeText(await screen.findByLabelText('Add something about you'), '  Training for a  half marathon ')
    await fireEvent.press(screen.getByRole('button', { name: 'Add' }))

    expect(await fact('Training for a half marathon')).toBeOnTheScreen()
    expect(screen.getByLabelText('Add something about you')).toHaveDisplayValue('')
    await waitFor(async () => expect((await openPreview()).props.children).toContain('  • Training for a half marathon'))
  })

  it("keeps the text and shows the server's reason when a fact is refused", async () => {
    server.use(http.post(`${API}/api/users/me/facts`, () => new HttpResponse('You can keep up to 20 things here. Delete one to add another.', { status: 400 })))
    await renderApp('/about-you')
    await fireEvent.changeText(await screen.findByLabelText('Add something about you'), 'One too many')
    await fireEvent.press(screen.getByRole('button', { name: 'Add' }))

    expect(await screen.findByText(/up to 20 things/)).toBeOnTheScreen()
    expect(screen.getByLabelText('Add something about you')).toHaveDisplayValue('One too many')
  })

  it('deletes a fact, and puts it back if deleting fails', async () => {
    await renderApp('/about-you')
    await fireEvent.press(await screen.findByRole('button', { name: 'Delete “I work night shifts”' }))
    expect(await screen.findByText(/Nothing yet/)).toBeOnTheScreen()
    expect(db.aiContext.facts).toHaveLength(0)
  })

  it('switching a kind of context off removes it from what is sent', async () => {
    await renderApp('/about-you')
    const themes = await screen.findByRole('switch', { name: 'Use what you often write about' })
    await fireEvent.press(themes)

    await waitFor(() => expect(db.aiContext.settings.useThemes).toBe(false))
    expect((await openPreview()).props.children).not.toContain('often writes about')
  })

  it('flips a switch back if saving it fails', async () => {
    server.use(http.put(`${API}/api/users/me/ai-context/settings`, () => HttpResponse.error()))
    await renderApp('/about-you')
    await fireEvent.press(await screen.findByRole('switch', { name: 'Use past advice' }))

    expect((await screen.findAllByText(/Can't reach the One Percent server/)).length).toBeGreaterThan(0)
    expect(screen.getByRole('switch', { name: 'Use past advice' })).toBeChecked()
  })
})
