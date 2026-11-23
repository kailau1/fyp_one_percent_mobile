import { Pressable, View } from 'react-native'
import { useTheme } from '@/theme/ThemeProvider'

/** An on/off switch in the web app's style. `label` is its accessible name. */
export function Switch({ value, onValueChange, label, disabled }: { value: boolean; onValueChange: (value: boolean) => void; label: string; disabled?: boolean }) {
  const { colors } = useTheme()
  return (
    <Pressable
      role="switch"
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value, disabled }}
      aria-checked={value}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      hitSlop={10}
      style={{
        width: 44,
        height: 26,
        borderRadius: 13,
        borderWidth: 1,
        justifyContent: 'center',
        borderColor: value ? colors.action : colors.line,
        backgroundColor: value ? colors.action : colors.sunken,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <View
        style={{
          width: 18,
          height: 18,
          borderRadius: 9,
          marginLeft: value ? 21 : 3,
          backgroundColor: value ? colors.onAction : colors.inkFaint,
        }}
      />
    </Pressable>
  )
}
