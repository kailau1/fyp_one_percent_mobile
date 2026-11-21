import { fireEvent, screen, waitFor } from '@testing-library/react-native'
import { http, HttpResponse } from 'msw'
import { storage } from '@/lib/storage'
import { renderApp } from '@/test/app'
import { signIn } from '@/test/auth'
import { db } from '@/test/msw/db'
import { API, server } from '@/test/msw/server'

beforeEach(() => {
  signIn()
})

const entry = (name: string) => screen.findByRole('link', { name })
const field = (name: 'Title' | 'Entry') => screen.findByLabelText(name, { exact: true })

describe('journal list', () => {
  it('shows entries newest first, grouped by month', async () => {
    await renderApp('/journal')

    expect(await screen.findByText('November 2026')).toBeOnTheScreen()
    expect(screen.getByText('October 2026')).toBeOnTheScreen()
    const titles = screen.getAllByRole('link').map((link) => link.props.accessibilityLabel)
    expect(titles).toEqual(['A slow start', 'Good run', 'October thoughts'])
  })

  it('filters by search across titles and text', async () => {
    await renderApp('/journal')
    await entry('A slow start')

    await fireEvent.changeText(screen.getByLabelText('Search entries'), 'clear-headed')

    expect(await screen.findByText('1 entry matches “clear-headed”')).toBeOnTheScreen()
    expect(screen.getByRole('link', { name: 'Good run' })).toBeOnTheScreen()
    expect(screen.queryByRole('link', { name: 'A slow start' })).toBeNull()
  })

  it('invites a first entry when the journal is empty', async () => {
    db.journals = []
    await renderApp('/journal')

    expect(await screen.findByText('Your journal is empty')).toBeOnTheScreen()
    expect(screen.getByRole('button', { name: 'Write your first entry' })).toBeOnTheScreen()
    expect(screen.queryByLabelText('Search entries')).toBeNull() // nothing to search yet
  })

  it("shows a retry when the server can't be reached, and recovers", async () => {
    let fail = true
    server.use(http.get(`${API}/api/journals`, () => (fail ? HttpResponse.error() : undefined)))
    await renderApp('/journal')

    const retry = await screen.findByRole('button', { name: 'Try again' }, { timeout: 5000 })
    fail = false
    await fireEvent.press(retry)
    expect(await entry('A slow start')).toBeOnTheScreen()
  })
})

describe('reading and editing an entry', () => {
  it('opens an entry from the list', async () => {
    await renderApp('/journal')
    await fireEvent.press(await entry('Good run'))

    expect(await field('Title')).toHaveDisplayValue('Good run')
    expect(screen.getByLabelText('Entry', { exact: true })).toHaveDisplayValue('Ran 5k before work and felt clear-headed all morning.')
  })

  it('saves changes and keeps the existing AI feedback', async () => {
    await renderApp('/journal/j2')
    await fireEvent.changeText(await field('Entry'), 'Ran 10k this time.')
    expect(screen.getByText('Unsaved changes')).toBeOnTheScreen()

    await fireEvent.press(screen.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByText('Saved')).toBeOnTheScreen()
    const saved = db.journals.find((j) => j.id === 'j2')!
    expect(saved.content).toBe('Ran 10k this time.')
    expect(saved.llmResponse).toMatch(/Try pairing it/)
  })

  it('keeps your text and offers a retry when saving fails', async () => {
    server.use(http.put(`${API}/api/journals/entry`, () => new HttpResponse(null, { status: 500 })))
    await renderApp('/journal/j1')
    await fireEvent.changeText(await field('Entry'), 'Do not lose me')

    await fireEvent.press(screen.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByText(/went wrong on the server/i)).toBeOnTheScreen()
    expect(screen.getByLabelText('Entry', { exact: true })).toHaveDisplayValue('Do not lose me')
    expect(screen.getByRole('button', { name: 'Try again' })).toBeOnTheScreen()
  })

  it('restores unsaved writing when you come back to the entry', async () => {
    storage.setJson('draft.j1', { title: 'A slow start', content: 'Half a thought' })
    await renderApp('/journal/j1')

    expect(await field('Entry')).toHaveDisplayValue('Half a thought')
    expect(screen.getByText(/Restored what you were writing before/)).toBeOnTheScreen()

    await fireEvent.press(screen.getByRole('button', { name: 'Discard it' }))
    expect(screen.getByLabelText('Entry', { exact: true })).toHaveDisplayValue(/putting off the report/)
  })

  it('says so when the entry does not exist', async () => {
    await renderApp('/journal/nope')
    expect(await screen.findByText('This entry doesn’t exist')).toBeOnTheScreen()
  })
})

describe('writing a new entry', () => {
  it('creates the entry and opens it, and its draft is gone', async () => {
    const result = await renderApp('/journal/new')
    await fireEvent.changeText(await field('Title'), 'Fresh page')
    await fireEvent.changeText(screen.getByLabelText('Entry', { exact: true }), 'Today I started something new.')

    await fireEvent.press(screen.getByRole('button', { name: 'Save entry' }))

    await waitFor(() => expect(result.getPathname()).toMatch(/^\/journal\/j\d+$/))
    expect(db.journals.at(-1)).toMatchObject({ title: 'Fresh page', content: 'Today I started something new.' })
    expect(await screen.findByText('Saved')).toBeOnTheScreen()
    expect(storage.get('draft.new')).toBeNull()
  })

  it('keeps a new entry as a draft if saving fails', async () => {
    server.use(http.post(`${API}/api/journals`, () => new HttpResponse(null, { status: 500 })))
    await renderApp('/journal/new')
    await fireEvent.changeText(await field('Entry'), 'Do not lose me')
    await fireEvent.press(screen.getByRole('button', { name: 'Save entry' }))

    expect(await screen.findByText(/went wrong on the server/i)).toBeOnTheScreen()
    await waitFor(() => expect(storage.getJson('draft.new')).toMatchObject({ content: 'Do not lose me' }))
  })

  it('starts with a question as its title (from "Write about this")', async () => {
    await renderApp('/journal/new?prompt=What%20made%20today%20heavy%3F')
    expect(await field('Title')).toHaveDisplayValue('What made today heavy?')
    expect(screen.getByLabelText('Entry', { exact: true })).toHaveDisplayValue('')
  })
})

describe('deleting an entry', () => {
  it('asks first, then deletes and returns to the list', async () => {
    await renderApp('/journal')
    await fireEvent.press(await entry('A slow start'))
    await fireEvent.press(await screen.findByRole('button', { name: 'Delete entry' }))

    expect(await screen.findByText('Delete this entry?')).toBeOnTheScreen()
    await fireEvent.press(screen.getAllByRole('button', { name: 'Delete entry' }).at(-1)!)

    expect(await screen.findByText('Entry deleted')).toBeOnTheScreen()
    expect(db.journals.some((j) => j.id === 'j1')).toBe(false)
    await waitFor(() => expect(screen.queryByRole('link', { name: 'A slow start' })).toBeNull())
  })

  it('does nothing if you choose to keep it', async () => {
    await renderApp('/journal/j1')
    await fireEvent.press(await screen.findByRole('button', { name: 'Delete entry' }))
    await fireEvent.press(await screen.findByRole('button', { name: 'Keep entry' }))

    expect(db.journals.some((j) => j.id === 'j1')).toBe(true)
  })
})

describe('themes on an entry', () => {
  it('shows the themes, and removes a wrong one', async () => {
    await renderApp('/journal/j1')
    expect(await screen.findByText('Procrastination')).toBeOnTheScreen()

    await fireEvent.press(screen.getByRole('button', { name: 'Remove theme Self-doubt' }))

    await waitFor(() => expect(db.journals.find((j) => j.id === 'j1')!.themes).toEqual(['procrastination']))
  })

  it('adds a missing theme from a sheet of the ones it does not have', async () => {
    await renderApp('/journal/j1')
    await fireEvent.press(await screen.findByRole('button', { name: 'Add theme' }))

    expect(await screen.findByRole('menuitem', { name: 'Anxiety' })).toBeOnTheScreen()
    expect(screen.queryByRole('menuitem', { name: 'Procrastination' })).toBeNull() // it has that one
    await fireEvent.press(screen.getByRole('menuitem', { name: 'Anxiety' }))

    await waitFor(() => expect(db.journals.find((j) => j.id === 'j1')!.themes).toEqual(['procrastination', 'self-doubt', 'anxiety']))
  })

  it('puts the theme back and says why if the change fails', async () => {
    server.use(http.put(`${API}/api/journals/entry/:id/themes`, () => HttpResponse.error()))
    await renderApp('/journal/j1')
    await fireEvent.press(await screen.findByRole('button', { name: 'Remove theme Self-doubt' }))

    expect(await screen.findByText(/Can't reach the One Percent server/)).toBeOnTheScreen()
    expect(await screen.findByRole('button', { name: 'Remove theme Self-doubt' })).toBeOnTheScreen()
  })
})

describe('feedback on an entry', () => {
  it('shows feedback the entry already has, rendered from markdown', async () => {
    await renderApp('/journal/j2')
    expect(await screen.findByText('Try pairing it')).toBeOnTheScreen()
    expect(screen.getByRole('button', { name: 'Get fresh feedback' })).toBeOnTheScreen()
  })

  it('requests feedback, shows progress, then the result, and it is saved on the entry', async () => {
    let reply!: () => void
    const replied = new Promise<void>((resolve) => (reply = resolve))
    server.use(
      http.post(`${API}/api/ai/feedback`, async () => {
        await replied
        db.journals = db.journals.map((j) => (j.id === 'j1' ? { ...j, llmResponse: db.feedback } : j))
        return HttpResponse.json({ response: db.feedback })
      }),
    )
    await renderApp('/journal/j1')
    await fireEvent.press(await screen.findByRole('button', { name: 'Get feedback' }))

    expect(await screen.findByText(/Reading your entry/)).toBeOnTheScreen()
    reply()
    expect(await screen.findByText('two-minute rule')).toBeOnTheScreen()
  })

  it('saves unsaved changes first, so the feedback is about what is on screen', async () => {
    const calls: string[] = []
    server.events.on('request:start', ({ request }) => {
      if (request.method !== 'GET') calls.push(`${request.method} ${new URL(request.url).pathname}`)
    })
    await renderApp('/journal/j1')
    await fireEvent.changeText(await field('Entry'), 'New thoughts')
    await fireEvent.press(screen.getByRole('button', { name: 'Save and get feedback' }))

    expect(await screen.findByText('two-minute rule')).toBeOnTheScreen()
    expect(calls).toEqual(['PUT /api/journals/entry', 'POST /api/ai/feedback'])
    server.events.removeAllListeners()
  })

  it('shows an error with a retry when feedback fails, and never stores the error as feedback', async () => {
    server.use(http.post(`${API}/api/ai/feedback`, () => new HttpResponse(null, { status: 500 })))
    await renderApp('/journal/j1')
    await fireEvent.press(await screen.findByRole('button', { name: 'Get feedback' }))

    expect(await screen.findByText(/went wrong on the server/i)).toBeOnTheScreen()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeOnTheScreen()
    expect(db.journals.find((j) => j.id === 'j1')!.llmResponse).toBeNull()
  })

  it('saves a brand-new entry, then gets feedback on it', async () => {
    const result = await renderApp('/journal/new')
    await fireEvent.changeText(await field('Entry'), 'Brand new')
    await fireEvent.press(screen.getByRole('button', { name: 'Save and get feedback' }))

    expect(await screen.findByText('two-minute rule')).toBeOnTheScreen()
    expect(result.getPathname()).toMatch(/^\/journal\/j\d+$/)
  })
})

describe('writing prompts', () => {
  it('suggests prompts and uses the one you pick as the title', async () => {
    await renderApp('/journal/new')
    await fireEvent.press(await screen.findByRole('button', { name: 'Suggest something to write about' }))
    await fireEvent.press(await screen.findByRole('button', { name: 'What drained you today?' }))

    expect(await field('Title')).toHaveDisplayValue('What drained you today?')
  })

  it('offers a retry when prompts fail to load', async () => {
    server.use(http.get(`${API}/api/ai/prompt`, () => new HttpResponse(null, { status: 500 })))
    await renderApp('/journal/new')
    await fireEvent.press(await screen.findByRole('button', { name: 'Suggest something to write about' }))

    expect(await screen.findByRole('button', { name: 'Try again' }, { timeout: 5000 })).toBeOnTheScreen()
  })

  it('is only offered on new entries', async () => {
    await renderApp('/journal/j1')
    await field('Title')
    expect(screen.queryByRole('button', { name: 'Suggest something to write about' })).toBeNull()
  })
})
