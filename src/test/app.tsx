import { renderRouter } from 'expo-router/testing-library'

/**
 * Renders the real app (every route in src/app, with its layouts) starting at a URL. renderRouter
 * turns Jest's fake timers on; jest.config.js makes them advance with real time, so requests to the
 * fake backend complete.
 */
export function renderApp(initialUrl = '/') {
  return renderRouter('./src/app', { initialUrl })
}
