import { render } from '@testing-library/react-native'
import type { ReactElement } from 'react'
import { AppProviders } from '@/components/AppProviders'

/** Renders a component inside the app's providers (data cache, theme, toasts), as tests on the web do. */
export async function renderWithProviders(ui: ReactElement) {
  return await render(<AppProviders>{ui}</AppProviders>)
}
