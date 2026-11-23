import { fireEvent, screen, waitFor } from '@testing-library/react-native'
import { http, HttpResponse } from 'msw'
import { renderApp } from '@/test/app'
import { signIn } from '@/test/auth'
import { db } from '@/test/msw/db'
import { API, server } from '@/test/msw/server'
import { journalToHtml } from './html'

// The phone's file system, printing and share sheet, recorded instead of used.
const mockWritten: { name: string; text: string }[] = []
jest.mock('expo-file-system', () => ({
  Paths: { cache: 'cache' },
  File: jest.fn().mockImplementation((_dir: string, name: string) => ({
    uri: `file:///cache/${name}`,
    exists: false,
    delete: jest.fn(),
    create: jest.fn(),
    write: jest.fn((text: string) => mockWritten.push({ name, text })),
  })),
}))
jest.mock('expo-print', () => ({ printToFileAsync: jest.fn(async () => ({ uri: 'file:///cache/journal.pdf' })) }))
jest.mock('expo-sharing', () => ({ shareAsync: jest.fn(async () => {}) }))

const Print = jest.requireMock('expo-print') as { printToFileAsync: jest.Mock }
const Sharing = jest.requireMock('expo-sharing') as { shareAsync: jest.Mock }

beforeEach(() => {
  signIn()
  mockWritten.length = 0
  Print.printToFileAsync.mockClear()
  Sharing.shareAsync.mockClear()
})

describe('exporting the whole journal (Account)', () => {
  it('shares every entry as one Markdown file, oldest first, with feedback', async () => {
    await renderApp('/account')
    await fireEvent.press(await screen.findByRole('button', { name: 'Markdown file' }))

    await waitFor(() => expect(Sharing.shareAsync).toHaveBeenCalledWith(expect.stringMatching(/one-percent-journal.*\.md$/), expect.objectContaining({ mimeType: 'text/markdown' })))
    const text = mockWritten[0].text
    expect(text.indexOf('October thoughts')).toBeLessThan(text.indexOf('A slow start'))
    expect(text).toContain('Try pairing it')
  })

  it('leaves AI feedback out when asked to', async () => {
    await renderApp('/account')
    await fireEvent.press(await screen.findByRole('switch', { name: 'Include AI feedback' }))
    await fireEvent.press(screen.getByRole('button', { name: 'Markdown file' }))

    await waitFor(() => expect(mockWritten).toHaveLength(1))
    expect(mockWritten[0].text).not.toContain('Try pairing it')
  })

  it('makes a PDF and shares it', async () => {
    await renderApp('/account')
    await fireEvent.press(await screen.findByRole('button', { name: 'PDF' }))

    await waitFor(() => expect(Sharing.shareAsync).toHaveBeenCalledWith('file:///cache/journal.pdf', expect.objectContaining({ mimeType: 'application/pdf' })))
    expect(Print.printToFileAsync.mock.calls[0][0].html).toContain('<h1>A slow start</h1>')
  })

  it('says so when there is nothing to export', async () => {
    db.journals = []
    await renderApp('/account')
    await fireEvent.press(await screen.findByRole('button', { name: 'Markdown file' }))

    expect(await screen.findByText('There are no entries to export yet.')).toBeOnTheScreen()
    expect(Sharing.shareAsync).not.toHaveBeenCalled()
  })

  it("says why when the journal can't be fetched", async () => {
    server.use(http.get(`${API}/api/journals`, () => HttpResponse.error()))
    await renderApp('/account')
    await fireEvent.press(await screen.findByRole('button', { name: 'PDF' }))

    expect(await screen.findByText(/Can't reach the One Percent server/, {}, { timeout: 5000 })).toBeOnTheScreen()
  })
})

describe('journalToHtml', () => {
  it('escapes what people write and renders the feedback Markdown', () => {
    const html = journalToHtml(
      [{ id: 'x', title: '<script>', content: 'a & b\n\nnext', llmResponse: 'Try **this**:\n\n- one\n- two', createdAt: '2026-11-14T09:00:00Z' }],
      { includeFeedback: true },
      new Date(2026, 10, 21),
    )
    expect(html).toContain('<h1>&lt;script&gt;</h1>')
    expect(html).toContain('<p>a &amp; b</p><p>next</p>')
    expect(html).toContain('<strong>this</strong>')
    expect(html).toContain('<ul><li>one</li><li>two</li></ul>')
    expect(html).toContain('1 entry.')
  })
})
