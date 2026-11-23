import type { ReactNode } from 'react'
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '@/theme/ThemeProvider'
import { gutter, radius } from '@/theme/tokens'
import { Button } from './Button'
import { Text } from './Text'

/**
 * A panel that slides up from the bottom: the phone's version of the web app's menus and
 * dialogs. Tapping outside it, the Close button or the back gesture closes it.
 */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.fill}>
        <Pressable style={[styles.fill, { backgroundColor: '#0008' }]} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" />
        <View
          role="dialog"
          aria-label={title}
          style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.line, paddingBottom: insets.bottom + 16 }]}
        >
          <View style={styles.header}>
            <Text variant="subheading" role="heading">
              {title}
            </Text>
            <Button variant="ghost" size="sm" onPress={onClose}>
              Close
            </Button>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 8 }}>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

/** "Are you sure?" for things that can't be undone, in the app's style (as the web's Dialog). */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  busy,
}: {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
  busy?: boolean
}) {
  const { colors } = useTheme()
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View style={[styles.fill, styles.center, { backgroundColor: '#0008' }]}>
        <View role="alertdialog" aria-label={title} style={[styles.dialog, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <Text variant="subheading" role="heading">
            {title}
          </Text>
          <Text tone="muted">{description}</Text>
          <View style={styles.actions}>
            <Button variant="secondary" onPress={onCancel}>
              {cancelLabel}
            </Button>
            <Button variant="danger" onPress={onConfirm} loading={busy}>
              {confirmLabel}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { justifyContent: 'center', padding: gutter },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '85%',
    borderTopLeftRadius: radius.panel,
    borderTopRightRadius: radius.panel,
    borderWidth: 1,
    paddingHorizontal: gutter,
    paddingTop: 16,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  dialog: { borderRadius: radius.panel, borderWidth: 1, padding: 24, gap: 12 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
})
