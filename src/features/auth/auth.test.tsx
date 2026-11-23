import { fireEvent, screen, waitFor } from '@testing-library/react-native'
import { http, HttpResponse } from 'msw'
import { session } from '@/api/session'
import { renderApp } from '@/test/app'
import { makeToken, signIn, testUser } from '@/test/auth'
import { db } from '@/test/msw/db'
import { CORRECT_PASSWORD } from '@/test/msw/handlers'
import { API, server } from '@/test/msw/server'

const loginScreen = () => screen.findByRole('heading', { name: 'Log in' })

async function fillLogin(email: string, password: string) {
  await fireEvent.changeText(await screen.findByLabelText('Email'), email)
  await fireEvent.changeText(screen.getByLabelText('Password'), password)
  await fireEvent.press(screen.getByRole('button', { name: 'Log in' }))
}

describe('route protection', () => {
  it('shows login to someone who is logged out', async () => {
    await renderApp('/')
    expect(await loginScreen()).toBeOnTheScreen()
  })

  it('keeps you logged in when the app opens again', async () => {
    signIn()
    await renderApp('/')
    expect(await screen.findByRole('heading', { name: 'Today’s habits' })).toBeOnTheScreen()
  })

  it('treats an expired stored token as logged out and says why', async () => {
    session.setToken(makeToken({ exp: Math.floor(Date.now() / 1000) - 60 }))
    await renderApp('/')

    expect(await loginScreen()).toBeOnTheScreen()
    expect(screen.getByText(/Your session expired/)).toBeOnTheScreen()
    expect(session.getToken()).toBeNull()
  })

  it('treats a tampered, unreadable token as logged out', async () => {
    session.setToken('not-a-jwt')
    await renderApp('/')
    expect(await loginScreen()).toBeOnTheScreen()
  })

  it('logs you out when the server rejects the token mid-session', async () => {
    signIn()
    server.use(http.get(`${API}/api/users/me`, () => new HttpResponse(null, { status: 401 })))
    await renderApp('/account')

    expect(await loginScreen()).toBeOnTheScreen()
    expect(screen.getByText(/Your session expired/)).toBeOnTheScreen()
  })
})

describe('logging in', () => {
  it('logs in and lands on Today', async () => {
    const result = await renderApp('/')
    await fillLogin(testUser.email, CORRECT_PASSWORD)

    expect(await screen.findByRole('heading', { name: 'Today’s habits' })).toBeOnTheScreen()
    expect(result.getPathname()).toBe('/')
    expect(session.getToken()).not.toBeNull()
  })

  it('explains a wrong password without calling it an expired session', async () => {
    server.use(http.post(`${API}/api/users/login`, () => new HttpResponse(null, { status: 401 })))
    await renderApp('/')
    await fillLogin(testUser.email, 'wrong')

    expect(await screen.findByText('That email and password don’t match an account.')).toBeOnTheScreen()
    expect(screen.queryByText(/session expired/)).toBeNull()
  })

  it("says so when the server can't be reached", async () => {
    server.use(http.post(`${API}/api/users/login`, () => HttpResponse.error()))
    await renderApp('/')
    await fillLogin(testUser.email, 'x')

    expect(await screen.findByText(/Can't reach the One Percent server/)).toBeOnTheScreen()
  })

  it('validates before contacting the server', async () => {
    let called = false
    server.use(
      http.post(`${API}/api/users/login`, () => {
        called = true
        return HttpResponse.json({ token: makeToken() })
      }),
    )
    await renderApp('/')
    await fillLogin('not-an-email', '')

    expect(await screen.findByText('Enter a valid email address')).toBeOnTheScreen()
    expect(screen.getByText('Enter your password')).toBeOnTheScreen()
    expect(called).toBe(false)
  })
})

describe('signing up', () => {
  async function fillSignup(password = CORRECT_PASSWORD) {
    await fireEvent.changeText(await screen.findByLabelText('First name'), 'Ada')
    await fireEvent.changeText(screen.getByLabelText('Last name'), 'Lovelace')
    await fireEvent.changeText(screen.getByLabelText('Email'), 'ada@example.com')
    await fireEvent.changeText(screen.getByLabelText('Password'), password)
    await fireEvent.press(screen.getByRole('button', { name: 'Create account' }))
  }

  it('is reached from login, creates the account and logs straight in', async () => {
    await renderApp('/')
    await fireEvent.press(await screen.findByRole('button', { name: 'Create an account' }))
    await fillSignup()

    expect(await screen.findByRole('heading', { name: 'Today’s habits' })).toBeOnTheScreen()
  })

  it('shows "email already exists" next to the email field', async () => {
    server.use(
      http.post(`${API}/api/users/register`, () => new HttpResponse('An account with this email already exists.', { status: 400 })),
    )
    await renderApp('/signup')
    await fillSignup()

    expect(await screen.findByText('An account with this email already exists.')).toBeOnTheScreen()
  })

  it('requires a password of at least 8 characters', async () => {
    await renderApp('/signup')
    await fillSignup('short')

    expect(await screen.findByText('Use at least 8 characters')).toBeOnTheScreen()
  })
})

describe('account', () => {
  it('shows who is logged in and logs out', async () => {
    signIn()
    await renderApp('/account')

    expect(await screen.findByText(`${testUser.firstName} ${testUser.lastName}`)).toBeOnTheScreen()
    expect(screen.getByText(testUser.email)).toBeOnTheScreen()
    await fireEvent.press(screen.getByRole('button', { name: 'Log out' }))

    expect(await loginScreen()).toBeOnTheScreen()
    expect(screen.queryByText(/session expired/)).toBeNull()
    await waitFor(() => expect(session.getToken()).toBeNull())
  })

  it('shows the time zone the server counts days in', async () => {
    signIn()
    db.profile = { ...db.profile, timeZone: 'America/New_York' }
    await renderApp('/account')
    expect(await screen.findByText('America / New York')).toBeOnTheScreen()
  })

  it('lets you choose light or dark, or follow the phone', async () => {
    signIn()
    await renderApp('/account')

    const dark = await screen.findByRole('radio', { name: 'Dark' })
    await fireEvent.press(dark)
    expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked()
  })
})
