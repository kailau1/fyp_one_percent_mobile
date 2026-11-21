import { screen, waitFor } from '@testing-library/react-native'
import { http, HttpResponse } from 'msw'
import { renderApp } from '@/test/app'
import { signIn } from '@/test/auth'
import { db } from '@/test/msw/db'
import { API, server } from '@/test/msw/server'

// The phone's time zone, as expo-localization would report it.
let mockPhoneZone: string | null = 'Asia/Tokyo'
jest.mock('@/lib/deviceTimeZone', () => ({ deviceTimeZone: () => mockPhoneZone }))

beforeEach(() => {
  mockPhoneZone = 'Asia/Tokyo'
  signIn()
})

describe('time zone sync', () => {
  it("tells the server this phone's time zone when it has none yet", async () => {
    db.profile = { ...db.profile, timeZone: null }
    await renderApp('/')

    await waitFor(() => expect(db.profile.timeZone).toBe('Asia/Tokyo'))
  })

  it('updates it after travelling, and Account shows the new zone', async () => {
    db.profile = { ...db.profile, timeZone: 'Europe/London' }
    await renderApp('/account')

    expect(await screen.findByText('Asia / Tokyo')).toBeOnTheScreen()
  })

  it("leaves it alone when it's already right", async () => {
    db.profile = { ...db.profile, timeZone: 'Asia/Tokyo' }
    let updates = 0
    server.use(
      http.put(`${API}/api/users/me/time-zone`, () => {
        updates++
        return HttpResponse.json(db.profile)
      }),
    )
    await renderApp('/account')

    expect(await screen.findByText('Asia / Tokyo')).toBeOnTheScreen()
    expect(updates).toBe(0)
  })

  it('tries once, quietly, if the server refuses the zone', async () => {
    mockPhoneZone = 'Not/AZone'
    let attempts = 0
    server.use(
      http.put(`${API}/api/users/me/time-zone`, () => {
        attempts++
        return new HttpResponse('That isn’t a time zone we recognise.', { status: 400 })
      }),
    )
    await renderApp('/account')

    await waitFor(() => expect(attempts).toBe(1))
    expect(screen.queryByText(/recognise/)).toBeNull()
  })
})

describe('account', () => {
  it("says so when the server hasn't got a time zone, rather than guessing", async () => {
    mockPhoneZone = null // nothing to sync
    db.profile = { ...db.profile, timeZone: null }
    await renderApp('/account')

    expect(await screen.findByText(/Not set yet/)).toBeOnTheScreen()
  })

  it("shows a retry if the profile can't be loaded", async () => {
    server.use(http.get(`${API}/api/users/me`, () => HttpResponse.error()))
    await renderApp('/account')

    expect(await screen.findByRole('button', { name: 'Try again' }, { timeout: 5000 })).toBeOnTheScreen()
  })
})
