import { router } from 'expo-router'
import { ArrowLeft, Share2, Trash2 } from 'lucide-react-native'
import { useEffect, useRef, useState, type ComponentRef } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Share, StyleSheet, TextInput, View, type TextStyle } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { getErrorMessage } from '@/api/client'
import type { JournalEntry } from '@/api/types'
import { ErrorState } from '@/components/ErrorState'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/Sheet'
import { Text } from '@/components/ui/Text'
import { toast } from '@/components/ui/Toast'
import { FeedbackPanel } from '@/features/ai/FeedbackPanel'
import { useRequestFeedback } from '@/features/ai/hooks'
import { PromptPicker } from '@/features/ai/PromptPicker'
import { entryTitle, entryToMarkdown } from '@/features/export/markdown'
import { formatLongDate, formatTime, parseDateTime } from '@/lib/dates'
import { useTheme } from '@/theme/ThemeProvider'
import { fonts, gutter, radius } from '@/theme/tokens'
import { drafts } from '../drafts'
import { useDeleteEntry, useSaveEntry } from '../hooks'
import { ThemeChips } from './ThemeChips'

interface EntryEditorProps {
  /** The entry being edited; leave out to write a new one. */
  entry?: JournalEntry
  /** A question to answer, for a new entry (e.g. "Write about this" on a weekly reflection). */
  prompt?: string
  /** Arriving from "Save and get feedback" on a new entry: ask once on arrival. */
  requestFeedbackOnOpen?: boolean
}

/**
 * Where entries are written and edited. The same three promises as the web app:
 *  - what you type is saved as a draft on the phone as you go, and restored if you come back;
 *  - a failed save leaves everything on screen with a retry;
 *  - existing AI feedback is sent back with every save (the backend would otherwise erase it).
 */
export function EntryEditor({ entry, prompt, requestFeedbackOnOpen }: EntryEditorProps) {
  const { colors } = useTheme()
  const saveEntry = useSaveEntry()
  const deleteEntry = useDeleteEntry()
  const feedback = useRequestFeedback()

  const savedTitle = entry?.title ?? ''
  const savedContent = entry?.content ?? ''
  const [seededTitle] = useState(() => (entry ? undefined : prompt))

  const [restoredDraft] = useState(() => {
    const draft = drafts.load(entry?.id)
    return draft && (draft.title !== savedTitle || draft.content !== savedContent) ? draft : null
  })
  const [title, setTitle] = useState(restoredDraft?.title ?? seededTitle ?? savedTitle)
  const [content, setContent] = useState(restoredDraft?.content ?? savedContent)
  const [showRestored, setShowRestored] = useState(restoredDraft !== null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [openedAt] = useState(() => new Date())
  const contentRef = useRef<ComponentRef<typeof TextInput>>(null)

  const dirty = title !== savedTitle || content !== savedContent
  const canSave = dirty && content.trim() !== '' && !saveEntry.isPending

  // Keep a draft while there are unsaved changes; drop it once there aren't.
  const pendingDraft = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => {
    if (!dirty) {
      drafts.clear(entry?.id)
      return
    }
    const timer = setTimeout(() => drafts.save(entry?.id, { title, content }), 400)
    pendingDraft.current = timer
    return () => clearTimeout(timer)
  }, [dirty, title, content, entry?.id])

  function save({ thenFeedback = false }: { thenFeedback?: boolean } = {}) {
    if (!canSave) return
    saveEntry.mutate(
      { id: entry?.id, input: { title: title.trim(), content, llmResponse: entry?.llmResponse ?? null } },
      {
        onSuccess: (saved) => {
          // a draft write still waiting would otherwise put the saved text back after this clear
          clearTimeout(pendingDraft.current)
          drafts.clear(entry?.id)
          setShowRestored(false)
          if (!entry) {
            // A new entry moves to its own screen; the editor there picks up the feedback request.
            router.replace({ pathname: '/journal/[id]', params: { id: saved.id, ...(thenFeedback ? { requestFeedback: '1' } : {}) } })
          } else {
            setTitle(saved.title ?? '')
            if (thenFeedback) feedback.mutate(saved.id)
          }
        },
      },
    )
  }

  // Feedback is about the saved text, so unsaved changes are saved first.
  function getFeedback() {
    if (!entry || dirty) save({ thenFeedback: true })
    else feedback.mutate(entry.id)
  }

  // Arriving from "Save and get feedback" on a new entry: ask once.
  const askedOnArrival = useRef(false)
  useEffect(() => {
    if (!entry || !requestFeedbackOnOpen || askedOnArrival.current) return
    askedOnArrival.current = true
    router.setParams({ requestFeedback: undefined })
    feedback.mutate(entry.id)
  }, [entry, requestFeedbackOnOpen, feedback])

  // A prompt becomes the entry's title (the question) and the text is the answer.
  function applyPrompt(picked: string) {
    setTitle(picked)
    contentRef.current?.focus()
  }

  function discardDraft() {
    drafts.clear(entry?.id)
    setTitle(savedTitle)
    setContent(savedContent)
    setShowRestored(false)
  }

  function confirmDelete() {
    if (!entry) return
    deleteEntry.mutate(entry.id, {
      onSuccess: () => {
        drafts.clear(entry.id)
        setConfirmingDelete(false)
        toast.success('Entry deleted')
        router.back()
      },
      onError: (error) => {
        setConfirmingDelete(false)
        toast.error(getErrorMessage(error))
      },
    })
  }

  // The phone's share sheet: save to Notes or Files, send by message or email (the web downloads a file).
  function shareEntry() {
    if (!entry) return
    Share.share({ title: entryTitle(entry), message: entryToMarkdown(entry, { includeFeedback: true }) }).catch(() => {})
  }

  const createdAt = parseDateTime(entry?.createdAt)
  const status = saveEntry.isPending ? 'Saving…' : dirty ? 'Unsaved changes' : entry ? 'Saved' : ''

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.paper }}>
      <View style={[styles.toolbar, { borderBottomColor: colors.line }]}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="All entries" hitSlop={10} style={styles.iconButton}>
          <ArrowLeft size={22} color={colors.ink} />
        </Pressable>
        <Text variant="small" tone="muted" role="status" style={{ flex: 1, textAlign: 'right' }}>
          {status}
        </Text>
        {entry && (
          <Pressable onPress={shareEntry} accessibilityRole="button" accessibilityLabel="Share entry" hitSlop={8} style={styles.iconButton}>
            <Share2 size={20} color={colors.inkMuted} />
          </Pressable>
        )}
        {entry && (
          <Pressable onPress={() => setConfirmingDelete(true)} accessibilityRole="button" accessibilityLabel="Delete entry" hitSlop={8} style={styles.iconButton}>
            <Trash2 size={20} color={colors.inkMuted} />
          </Pressable>
        )}
        <Button size="sm" onPress={() => save()} disabled={!canSave}>
          {entry ? 'Save changes' : 'Save entry'}
        </Button>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {showRestored && (
            <View role="status" style={[styles.restored, { borderColor: colors.line, backgroundColor: colors.skyWash }]}>
              <Text variant="small" style={{ flex: 1 }}>
                Restored what you were writing before. It isn’t saved yet.
              </Text>
              <Button variant="link" size="sm" onPress={discardDraft}>
                Discard it
              </Button>
            </View>
          )}
          {saveEntry.error && <ErrorState compact error={saveEntry.error} onRetry={() => save()} retrying={saveEntry.isPending} style={{ marginBottom: 24 }} />}
          {!entry && <PromptPicker onPick={applyPrompt} />}

          <Text variant="small" tone="muted" style={{ marginBottom: 12 }}>
            {createdAt ? `${formatLongDate(createdAt)}, ${formatTime(createdAt)}` : formatLongDate(openedAt)}
          </Text>
          {entry && <ThemeChips entry={entry} />}

          <TextInput
            value={title}
            onChangeText={(text) => setTitle(text.replace(/\n/g, ' '))}
            placeholder="Title"
            placeholderTextColor={colors.inkFaint}
            accessibilityLabel="Title"
            multiline
            scrollEnabled={false}
            submitBehavior="submit"
            returnKeyType="next"
            onSubmitEditing={() => contentRef.current?.focus()}
            style={[styles.title, noOutline, { color: colors.ink }]}
          />
          <TextInput
            ref={contentRef}
            value={content}
            onChangeText={setContent}
            placeholder="What’s on your mind?"
            placeholderTextColor={colors.inkFaint}
            accessibilityLabel="Entry"
            multiline
            scrollEnabled={false}
            autoFocus={!entry && !prompt}
            textAlignVertical="top"
            style={[styles.body, noOutline, { color: colors.ink, minHeight: entry ? 160 : 320 }]}
          />

          <View style={{ marginTop: 32 }}>
            <FeedbackPanel
              feedback={entry?.llmResponse}
              isPending={feedback.isPending}
              error={feedback.error}
              onRequest={getFeedback}
              nothingToReview={content.trim() === ''}
              needsSave={!entry || dirty}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmDialog
        open={confirmingDelete}
        title="Delete this entry?"
        description="The entry and its feedback will be gone for good. This can’t be undone."
        cancelLabel="Keep entry"
        confirmLabel={deleteEntry.isPending ? 'Deleting…' : 'Delete entry'}
        busy={deleteEntry.isPending}
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={confirmDelete}
      />
    </SafeAreaView>
  )
}

// The page itself is the writing surface, so no focus outline. Only the web preview would draw one,
// and React Native's types don't know the web-only value.
const noOutline = (Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) as unknown as TextStyle

const styles = StyleSheet.create({
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1 },
  iconButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: gutter, paddingTop: 20, paddingBottom: 64 },
  restored: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 24, borderWidth: 1, borderRadius: radius.control, paddingHorizontal: 16, paddingVertical: 10 },
  title: { fontFamily: fonts.serifMedium, fontSize: 30, lineHeight: 38, letterSpacing: -0.5, marginBottom: 16, padding: 0 },
  body: { fontFamily: fonts.serif, fontSize: 18, lineHeight: 32, padding: 0 },
})
