import { useId, type ComponentRef, type Ref } from 'react'
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native'
import { useTheme } from '@/theme/ThemeProvider'
import { fonts, radius } from '@/theme/tokens'
import { Text } from './Text'

export interface FieldProps extends TextInputProps {
  label: string
  /** Validation message under the input, announced to screen readers. */
  error?: string
  /** A short helper line under the input (hidden while an error is shown). */
  hint?: string
  ref?: Ref<ComponentRef<typeof TextInput>>
}

/** A labelled text input with its error message, as on the web. */
export function Field({ label, error, hint, style, ref, ...props }: FieldProps) {
  const { colors } = useTheme()
  const id = useId()
  const message = error ?? hint
  return (
    <View style={styles.wrap}>
      <Text variant="label" nativeID={id}>
        {label}
      </Text>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        accessibilityLabelledBy={id}
        accessibilityHint={message}
        placeholderTextColor={colors.inkFaint}
        style={[
          styles.input,
          { backgroundColor: colors.surface, borderColor: error ? colors.danger : colors.line, color: colors.ink, fontFamily: fonts.sans },
          style,
        ]}
        {...props}
      />
      {message ? (
        <Text variant="small" tone={error ? 'danger' : 'muted'} accessibilityLiveRegion={error ? 'polite' : 'none'} role={error ? 'alert' : undefined}>
          {message}
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  input: { minHeight: 44, borderWidth: 1, borderRadius: radius.control, paddingHorizontal: 12, fontSize: 16 },
})
