import { Lightbulb, RotateCw } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { ErrorState } from '@/components/ErrorState'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { Skeleton } from '@/components/ui/Skeleton'
import { Text } from '@/components/ui/Text'
import { useTheme } from '@/theme/ThemeProvider'
import { radius } from '@/theme/tokens'
import { usePrompts } from './hooks'

/** "Suggest something to write about": AI prompts in a sheet; picking one becomes the entry's title. */
export function PromptPicker({ onPick }: { onPick: (prompt: string) => void }) {
  const { colors } = useTheme()
  const [open, setOpen] = useState(false)
  const { data: prompts, error, isFetching, refetch } = usePrompts(open)

  return (
    <>
      <Button variant="secondary" size="sm" icon={Lightbulb} onPress={() => setOpen(true)} style={{ marginBottom: 24 }}>
        Suggest something to write about
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Pick a prompt">
        <View role="region" aria-label="Writing prompts">
          {isFetching && (
            <View role="status" aria-label="Loading prompts" style={{ gap: 10 }}>
              <Skeleton height={44} />
              <Skeleton height={44} />
              <Skeleton height={44} />
            </View>
          )}
          {!isFetching && Boolean(error) && <ErrorState compact error={error} onRetry={() => refetch()} />}
          {!isFetching && !error && prompts && (
            <>
              {prompts.length === 0 && <Text tone="muted">No suggestions came back this time.</Text>}
              <View style={{ gap: 8 }}>
                {prompts.map((prompt) => (
                  <Pressable
                    key={prompt}
                    accessibilityRole="button"
                    onPress={() => {
                      onPick(prompt)
                      setOpen(false)
                    }}
                    style={({ pressed }) => ({
                      borderWidth: 1,
                      borderColor: colors.line,
                      borderRadius: radius.control,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      backgroundColor: pressed ? colors.skyWash : 'transparent',
                    })}
                  >
                    <Text serif style={{ fontSize: 17, lineHeight: 24 }}>
                      {prompt}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Button variant="link" size="sm" icon={RotateCw} onPress={() => refetch()} style={{ marginTop: 16 }}>
                Suggest different ones
              </Button>
            </>
          )}
        </View>
      </Sheet>
    </>
  )
}
