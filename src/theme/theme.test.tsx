import { fireEvent, render, screen } from '@testing-library/react-native'
import { Pressable, Text } from 'react-native'
import { storage } from '@/lib/storage'
import { ThemeProvider, useTheme } from './ThemeProvider'
import { dark, light } from './tokens'

function Probe() {
  const { scheme, colors, mode, setMode } = useTheme()
  return (
    <>
      <Text>{`${mode}:${scheme}:${colors.paper}`}</Text>
      <Pressable accessibilityRole="button" onPress={() => setMode('dark')}>
        <Text>dark</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => setMode('system')}>
        <Text>system</Text>
      </Pressable>
    </>
  )
}

describe('theme', () => {
  it("uses the web app's colours and follows the system until the user picks", async () => {
    await render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )
    expect(screen.getByText(`system:light:${light.paper}`)).toBeOnTheScreen()

    await fireEvent.press(screen.getByText('dark'))
    expect(screen.getByText(`dark:dark:${dark.paper}`)).toBeOnTheScreen()
    expect(storage.get('theme')).toBe('dark')

    await fireEvent.press(screen.getByText('system'))
    expect(storage.get('theme')).toBeNull()
  })

  it('remembers the choice', async () => {
    storage.set('theme', 'dark')
    await render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )
    expect(screen.getByText(`dark:dark:${dark.paper}`)).toBeOnTheScreen()
  })
})
