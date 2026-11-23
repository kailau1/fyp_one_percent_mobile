import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { Text } from '@/components/ui/Text'
import { useTheme } from '@/theme/ThemeProvider'
import { describeTrend, monthName } from './trend'

const HEIGHT = 32 // points of bar area; the tallest month fills it

/**
 * Six small bars, one per month, oldest first: how often a theme came up. The sentence underneath
 * says the same in words (and is what screen readers get); tapping a bar names its month.
 */
export function MonthBars({ months, counts, name }: { months: string[]; counts: number[]; name: string }) {
  const { colors } = useTheme()
  const [active, setActive] = useState<number | null>(null)
  const max = Math.max(...counts, 1)
  const summary = describeTrend(months, counts)
  const caption = active === null ? summary : `${monthName(months[active])}: ${counts[active]} ${counts[active] === 1 ? 'entry' : 'entries'}`

  return (
    <View style={{ alignItems: 'flex-end', gap: 6 }}>
      <View accessible accessibilityRole="image" accessibilityLabel={`${name} by month: ${summary}`} style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
        {counts.map((count, i) => (
          <Pressable
            key={months[i]}
            onPress={() => setActive(active === i ? null : i)}
            importantForAccessibility="no"
            style={{ width: 24, alignItems: 'center', gap: 4, paddingVertical: 2 }}
          >
            <View style={{ height: HEIGHT, justifyContent: 'flex-end' }}>
              <View
                style={{
                  width: 10,
                  borderTopLeftRadius: 4,
                  borderTopRightRadius: 4,
                  height: count === 0 ? 2 : Math.max((count / max) * HEIGHT, 4),
                  backgroundColor: count === 0 ? colors.line : colors.sky,
                  opacity: active !== null && active !== i ? 0.5 : 1,
                }}
              />
            </View>
            <Text variant="xs" tone={active === i ? 'ink' : 'faint'} style={{ fontSize: 11, lineHeight: 12 }}>
              {monthName(months[i], 'short').charAt(0)}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text variant="xs" tone="muted" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {caption}
      </Text>
    </View>
  )
}
