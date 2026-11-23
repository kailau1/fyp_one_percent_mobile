import { Pressable, View } from 'react-native'
import { useTheme } from '@/theme/ThemeProvider'
import { radius } from '@/theme/tokens'
import { Text } from './Text'

/** A small set of mutually exclusive choices, e.g. System / Light / Dark. */
export function Segmented<T extends string>({ label, options, value, onChange }: { label: string; options: { value: T; label: string }[]; value: T; onChange: (value: T) => void }) {
  const { colors } = useTheme()
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ flexDirection: 'row', alignSelf: 'flex-start', padding: 3, gap: 2, borderRadius: radius.control + 2, backgroundColor: colors.sunken }}>
      {options.map((option) => {
        const selected = option.value === value
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            aria-checked={selected}
            onPress={() => onChange(option.value)}
            style={{
              minHeight: 36,
              justifyContent: 'center',
              paddingHorizontal: 14,
              borderRadius: radius.control,
              backgroundColor: selected ? colors.surface : 'transparent',
              borderWidth: 1,
              borderColor: selected ? colors.line : 'transparent',
            }}
          >
            <Text variant="small" weight="medium" tone={selected ? 'ink' : 'muted'}>
              {option.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
