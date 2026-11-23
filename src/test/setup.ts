/* eslint-disable @typescript-eslint/no-require-imports -- jest.mock factories must use require() */
import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'
import { cleanup } from '@testing-library/react-native'
import { session } from '@/api/session'
import { storage } from '@/lib/storage'
import { resetDb } from './msw/db'
import { server } from './msw/server'

// The fake backend's address (the web tests use the same one). jest-expo's expoConfig is a real
// object: extend it rather than replace it.
;(Constants.expoConfig as { extra?: Record<string, unknown> }).extra = { BASE_URL: 'http://api.test' }

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default)

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
)
jest.mock('@react-native-community/netinfo', () => require('@react-native-community/netinfo/jest/netinfo-mock'))

// Any request a test doesn't explicitly mock is a mistake: fail loudly rather than hit a real server.
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(async () => {
  // the device storage mock outlives a test; clear it so one test's drafts can't appear in the next
  await AsyncStorage.clear()
  cleanup()
  server.resetHandlers()
  resetDb()
  storage.clearAll()
  session.clear()
})
afterAll(() => server.close())
