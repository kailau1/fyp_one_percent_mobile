import { router } from 'expo-router'
import { ArrowLeft, ChevronDown, ChevronRight, X } from 'lucide-react-native'
import { useState, type ReactNode } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { getErrorMessage } from '@/api/client'
import type { AiContext, AiContextSettings } from '@/api/types'
import { ErrorState } from '@/components/ErrorState'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { Field } from '@/components/ui/Field'
import { Skeleton } from '@/components/ui/Skeleton'
import { Switch } from '@/components/ui/Switch'
import { Text } from '@/components/ui/Text'
import { themeLabel } from '@/features/journal/themes'
import { useTheme } from '@/theme/ThemeProvider'
import { fonts, gutter, radius } from '@/theme/tokens'
import { useAddFact, useAiContext, useDeleteFact, useUpdateAiSettings } from './hooks'

/** One kind of context: what it is, whether it's sent, and what's in it. */
function Source({ title, description, setting, context, children }: { title: string; description: ReactNode; setting: keyof AiContextSettings; context: AiContext; children?: ReactNode }) {
  const { colors } = useTheme()
  const update = useUpdateAiSettings()
  const on = context.settings[setting]
  return (
    <View accessibilityLabel={title} style={{ paddingVertical: 24, borderBottomWidth: 1, borderBottomColor: colors.line, gap: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16 }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text variant="subheading" role="heading">
            {title}
          </Text>
          {typeof description === 'string' ? <Text tone="muted">{description}</Text> : description}
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4, paddingTop: 4 }}>
          <Switch value={on} label={`Use ${title.toLowerCase()}`} onValueChange={(checked) => update.mutate({ ...context.settings, [setting]: checked })} />
          <Text variant="xs" tone="muted" importantForAccessibility="no">
            {on ? 'Used' : 'Not used'}
          </Text>
        </View>
      </View>
      {children ? <View style={{ opacity: on ? 1 : 0.6 }}>{children}</View> : null}
    </View>
  )
}

function Facts({ context }: { context: AiContext }) {
  const { colors } = useTheme()
  const [text, setText] = useState('')
  const [error, setError] = useState<string>()
  const add = useAddFact()
  const remove = useDeleteFact()
  const full = context.facts.length >= context.maxFacts

  function submit() {
    if (!text.trim()) {
      setError('Write something to add.')
      return
    }
    setError(undefined)
    add.mutate(text, {
      onSuccess: () => setText(''),
      onError: (e) => setError(getErrorMessage(e)), // the text stays, so nothing is lost
    })
  }

  return (
    <View style={{ gap: 16 }}>
      {context.facts.length > 0 ? (
        <View accessibilityLabel="Things you’ve told One Percent" style={{ gap: 8 }}>
          {context.facts.map((fact) => (
            <View key={fact.id} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, borderRadius: radius.card, paddingLeft: 16, paddingRight: 6, paddingVertical: 8 }}>
              <Text style={{ flex: 1, paddingTop: 4 }}>{fact.text}</Text>
              <Pressable onPress={() => remove.mutate(fact.id)} accessibilityRole="button" accessibilityLabel={`Delete “${fact.text}”`} hitSlop={8} style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color={colors.inkFaint} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : (
        <Text tone="muted">Nothing yet. Add anything you’d want a thoughtful friend to keep in mind.</Text>
      )}
      {full ? (
        <Text variant="small" tone="muted">
          That’s the most it keeps ({context.maxFacts}). Delete one to add another.
        </Text>
      ) : (
        <View style={{ gap: 12 }}>
          <Field
            label="Add something about you"
            value={text}
            onChangeText={setText}
            maxLength={context.maxFactLength}
            placeholder="e.g. Training for a half marathon in March"
            returnKeyType="done"
            onSubmitEditing={submit}
            error={error}
            hint={`${context.facts.length} of ${context.maxFacts}. Short and factual works best.`}
          />
          <Button onPress={submit} loading={add.isPending}>
            Add
          </Button>
        </View>
      )}
    </View>
  )
}

function Preview({ text }: { text: string }) {
  const { colors } = useTheme()
  const [open, setOpen] = useState(false)
  const Icon = open ? ChevronDown : ChevronRight
  return (
    <View style={{ marginTop: 32, borderWidth: 1, borderColor: colors.line, borderRadius: radius.card, backgroundColor: colors.surface }}>
      <Pressable onPress={() => setOpen(!open)} accessibilityRole="button" accessibilityState={{ expanded: open }} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16 }}>
        <Icon size={16} color={colors.ink} />
        <Text weight="medium">Exactly what’s sent</Text>
      </Pressable>
      {open && (
        <View style={{ borderTopWidth: 1, borderTopColor: colors.line, padding: 16, gap: 12 }}>
          <Text variant="small" tone="muted">
            This goes with each request for feedback or writing prompts. Feedback on an entry also includes past advice, if that’s on.
          </Text>
          <Text accessibilityLabel="Context sent to the AI" variant="small" style={{ fontFamily: fonts.sans, lineHeight: 22 }}>
            {text}
          </Text>
        </View>
      )}
    </View>
  )
}

/** /about-you: the AI's memory of the user, visible and in their hands. */
export function AboutYouScreen() {
  const { colors } = useTheme()
  const { data, error, isPending, refetch, isFetching } = useAiContext()
  const pills = (items: string[], label: string) => (
    <View accessibilityLabel={label} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {items.map((item) => (
        <Chip key={item} label={item} />
      ))}
    </View>
  )

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.paper }}>
      <View style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back" hitSlop={10} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={22} color={colors.ink} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        <Text variant="title" role="heading" aria-level={1} style={{ marginBottom: 16 }}>
          What One Percent knows
        </Text>
        <Text tone="muted" style={{ marginBottom: 8 }}>
          When you ask for feedback or writing prompts, the AI is given a little context about you. This is all of it. Switch off anything you’d rather it didn’t use.
        </Text>
        {isPending && (
          <View role="status" aria-label="Loading what One Percent knows" style={{ gap: 24, marginTop: 16 }}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={{ gap: 10 }}>
                <Skeleton height={24} width="60%" />
                <Skeleton />
              </View>
            ))}
          </View>
        )}
        {error && <ErrorState compact={Boolean(data)} error={error} onRetry={() => refetch()} retrying={isFetching} style={{ marginTop: 16 }} />}
        {data && (
          <>
            <Source title="Things you’ve told it" setting="useFacts" context={data} description="In your own words, kept until you delete them.">
              <Facts context={data} />
            </Source>
            <Source
              title="Your habits"
              setting="useHabits"
              context={data}
              description={
                <View style={{ gap: 4 }}>
                  <Text tone="muted">Habits you’ve ticked or changed in the last week.</Text>
                  <Button variant="link" size="sm" onPress={() => router.navigate('/habits')}>
                    Manage habits
                  </Button>
                </View>
              }
            >
              {data.habits.length > 0 ? pills(data.habits, 'Habits it knows about') : <Text variant="small" tone="muted">None this week.</Text>}
            </Source>
            <Source
              title="What you often write about"
              setting="useThemes"
              context={data}
              description={
                <View style={{ gap: 4 }}>
                  <Text tone="muted">Your most common themes. You can correct an entry’s themes when you open it.</Text>
                  <Button variant="link" size="sm" onPress={() => router.navigate('/insights')}>
                    See insights
                  </Button>
                </View>
              }
            >
              {data.themes.length > 0 ? pills(data.themes.map(themeLabel), 'Themes it knows about') : <Text variant="small" tone="muted">No themes yet.</Text>}
            </Source>
            <Source
              title="Past advice"
              setting="usePastAdvice"
              context={data}
              description="With feedback on an entry, short summaries of what it suggested on your most similar earlier entries, so it doesn’t repeat itself."
            />
            <Preview text={data.preview} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
