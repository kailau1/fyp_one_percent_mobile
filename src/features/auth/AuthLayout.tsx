import type { ReactNode } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Wordmark } from '@/components/Wordmark'
import { Text } from '@/components/ui/Text'
import { useTheme } from '@/theme/ThemeProvider'
import { gutter } from '@/theme/tokens'
import { CompoundingCurve } from './CompoundingCurve'

/**
 * Shared frame for login and sign-up. On the web the "what it's about" panel sits beside the form;
 * on a phone it follows the form, so the form is what you see first.
 */
export function AuthLayout({ title, children, footer }: { title: string; children: ReactNode; footer: ReactNode }) {
  const { colors } = useTheme()
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Wordmark />
          <Text variant="title" role="heading" aria-level={1} style={styles.title}>
            {title}
          </Text>
          {children}
          <View style={styles.footer}>{footer}</View>

          <View style={[styles.about, { borderTopColor: colors.line }]}>
            <Text serif style={styles.tagline}>
              Get one percent better every day, and a year from now you’re thirty-seven times better.
            </Text>
            <CompoundingCurve />
            <Text tone="muted">
              A journal for thinking it through, habits for showing up, and feedback that remembers what you’ve already tried.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: gutter + 4, paddingTop: 32, paddingBottom: 48, maxWidth: 480, width: '100%', alignSelf: 'center' },
  title: { marginTop: 40, marginBottom: 28 },
  footer: { marginTop: 28, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4 },
  about: { marginTop: 48, paddingTop: 32, borderTopWidth: 1, gap: 20 },
  tagline: { fontSize: 26, lineHeight: 32, letterSpacing: -0.4 },
})
