import { fireEvent, screen } from '@testing-library/react-native'
import { ApiError } from '@/api/client'
import { renderWithProviders } from '@/test/render'
import { ErrorState } from './ErrorState'

describe('ErrorState', () => {
  it("says the server can't be reached, with a retry", async () => {
    const onRetry = jest.fn()
    await renderWithProviders(<ErrorState error={new ApiError('network')} onRetry={onRetry} />)

    expect(screen.getByText("Can't connect")).toBeOnTheScreen()
    expect(screen.getByText(/Can't reach the One Percent server/)).toBeOnTheScreen()
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalled()
  })

  it("shows a server error's safe message, and no button without a retry", async () => {
    await renderWithProviders(<ErrorState error={new ApiError('server')} />)

    expect(screen.getByText('Something went wrong')).toBeOnTheScreen()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('turns anything thrown into a message', async () => {
    await renderWithProviders(<ErrorState compact error={new Error('boom')} />)
    expect(screen.getByText('Something went wrong. Try again.')).toBeOnTheScreen()
  })
})
