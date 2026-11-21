import { Plus } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, View } from 'react-native'
import type { JournalEntry } from '@/api/types'
import { Chip } from '@/components/ui/Chip'
import { Sheet } from '@/components/ui/Sheet'
import { Text } from '@/components/ui/Text'
import { useTheme } from '@/theme/ThemeProvider'
import { radius } from '@/theme/tokens'
import { useSetEntryThemes } from '../hooks'
import { themeLabel } from '../themes'

/**
 * The themes an entry is about, as small chips the user can correct: remove one that's wrong, add
 * one that's missing (from a sheet). Kept quiet so the writing stays the focus. Hidden for servers
 * that don't send themes yet.
 */
export function ThemeChips({ entry }: { entry: JournalEntry }) {
  const { colors } = useTheme()
  const setThemes = useSetEntryThemes(entry.id)
  const [adding, setAdding] = useState(false)
  if (!entry.themes) return null

  const themes = entry.themes
  const addable = (entry.themeChoices ?? []).filter((theme) => !themes.includes(theme))

  return (
    <View role="group" aria-label="Themes" style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 20 }}>
      {themes.length === 0 && (
        <Text variant="small" tone="faint">
          No themes
        </Text>
      )}
      {themes.map((theme) => (
        <Chip
          key={theme}
          label={themeLabel(theme)}
          removeLabel={`Remove theme ${themeLabel(theme)}`}
          onRemove={() => setThemes.mutate(themes.filter((t) => t !== theme))}
        />
      ))}
      {addable.length > 0 && (
        <Pressable
          accessibilityRole="button"
          onPress={() => setAdding(true)}
          hitSlop={8}
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full, backgroundColor: pressed ? colors.sunken : 'transparent' })}
        >
          <Plus size={14} color={colors.inkMuted} />
          <Text variant="small" tone="muted">
            Add theme
          </Text>
        </Pressable>
      )}
      <Sheet open={adding} onClose={() => setAdding(false)} title="Add a theme">
        <View role="menu" style={{ gap: 4 }}>
          {addable.map((theme) => (
            <Pressable
              key={theme}
              role="menuitem"
              accessibilityRole="menuitem"
              onPress={() => {
                setAdding(false)
                setThemes.mutate([...themes, theme])
              }}
              style={({ pressed }) => ({ minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderRadius: radius.control, backgroundColor: pressed ? colors.sunken : 'transparent' })}
            >
              <Text>{themeLabel(theme)}</Text>
            </Pressable>
          ))}
        </View>
      </Sheet>
    </View>
  )
}
