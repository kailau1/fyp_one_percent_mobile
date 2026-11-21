import AsyncStorage from '@react-native-async-storage/async-storage'
import { hydrateStorage, storage } from './storage'

describe('storage', () => {
  beforeEach(() => AsyncStorage.clear())

  it('reads synchronously from memory and writes through to the device', async () => {
    storage.setJson('draft.new', { title: 'T', content: 'C' })

    expect(storage.getJson('draft.new')).toEqual({ title: 'T', content: 'C' })
    await new Promise((resolve) => setImmediate(resolve))
    expect(await AsyncStorage.getItem('onepercent.draft.new')).toBe('{"title":"T","content":"C"}')
  })

  it("loads what's saved on the device at launch, and only its own keys", async () => {
    await AsyncStorage.multiSet([
      ['onepercent.theme', 'dark'],
      ['someone-else', 'x'],
    ])

    await hydrateStorage()

    expect(storage.get('theme')).toBe('dark')
    expect(storage.get('someone-else')).toBeNull()
  })

  it('treats unreadable JSON as nothing stored', () => {
    storage.set('broken', '{nope')
    expect(storage.getJson('broken')).toBeNull()
  })
})
