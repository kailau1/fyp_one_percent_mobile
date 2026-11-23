import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { Pressable, View } from 'react-native'
import { z } from 'zod'
import { getErrorMessage } from '@/api/client'
import type { Habit } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Sheet } from '@/components/ui/Sheet'
import { Text } from '@/components/ui/Text'
import { useTheme } from '@/theme/ThemeProvider'
import { radius } from '@/theme/tokens'
import { DEFAULT_COLOUR, HABIT_COLOURS, safeColour } from '../habit'
import { useSaveHabit } from '../hooks'

const schema = z
  .object({
    habitType: z.enum(['standard', 'trigger-action']),
    habitName: z.string().trim(),
    description: z.string().trim(),
    // lower case: these sit mid-sentence ("When I pour my coffee, I will …")
    trigger: z.string().trim().toLowerCase(),
    action: z.string().trim().toLowerCase(),
    colour: z.string(),
  })
  .superRefine((values, context) => {
    const require = (field: 'habitName' | 'trigger' | 'action', message: string) => {
      if (!values[field]) context.addIssue({ code: 'custom', path: [field], message })
    }
    if (values.habitType === 'standard') {
      require('habitName', 'Give the habit a name')
    } else {
      require('trigger', 'Say what sets it off')
      require('action', 'Say what you’ll do')
    }
  })
type FormValues = z.infer<typeof schema>

function valuesFor(habit: Habit | undefined): FormValues {
  return {
    habitType: habit?.habitType ?? 'standard',
    habitName: habit?.habitName ?? '',
    description: habit?.description ?? '',
    trigger: habit?.trigger?.toLowerCase() ?? '',
    action: habit?.action?.toLowerCase() ?? '',
    colour: safeColour(habit?.colour ?? DEFAULT_COLOUR),
  }
}

const KINDS = [
  { value: 'standard', label: 'Simple', hint: 'Something you do each day' },
  { value: 'trigger-action', label: 'When → then', hint: 'Tied to something you already do' },
] as const

/** Create or edit a habit: a plain one, or a "When I …, I will …" trigger → action habit. */
export function HabitFormSheet({ open, onClose, habit }: { open: boolean; onClose: () => void; habit?: Habit }) {
  const { colors } = useTheme()
  const saveHabit = useSaveHabit()
  const {
    control,
    handleSubmit,
    setValue,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: valuesFor(habit) })

  // Each time the sheet opens, start from the habit as it is now (or a blank form).
  useEffect(() => {
    if (open) reset(valuesFor(habit))
  }, [open, habit, reset])

  const habitType = useWatch({ control, name: 'habitType' })
  const colour = useWatch({ control, name: 'colour' })

  const onSubmit = handleSubmit(async (values) => {
    const standard = values.habitType === 'standard'
    try {
      await saveHabit.mutateAsync({
        id: habit?.id,
        input: {
          habitType: values.habitType,
          colour: values.colour,
          // only send the fields that belong to this kind of habit
          habitName: standard ? values.habitName : '',
          description: standard ? values.description : '',
          trigger: standard ? undefined : values.trigger,
          action: standard ? undefined : values.action,
        },
      })
      onClose()
    } catch (error) {
      setError('root', { message: getErrorMessage(error) })
    }
  })

  const text = (name: 'habitName' | 'description' | 'trigger' | 'action', label: string, placeholder: string, lower = false) => (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Field
          label={label}
          placeholder={placeholder}
          value={field.value}
          // trigger and action are lower-cased as you type: they sit mid-sentence
          onChangeText={(value) => field.onChange(lower ? value.toLowerCase() : value)}
          onBlur={field.onBlur}
          autoCapitalize={lower ? 'none' : 'sentences'}
          error={errors[name]?.message}
        />
      )}
    />
  )

  return (
    <Sheet open={open} onClose={onClose} title={habit ? 'Edit habit' : 'New habit'}>
      <View style={{ gap: 20 }}>
        <View accessibilityRole="radiogroup" accessibilityLabel="Kind of habit" style={{ gap: 6 }}>
          <Text variant="label">Kind of habit</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {KINDS.map((kind) => {
              const selected = habitType === kind.value
              return (
                <Pressable
                  key={kind.value}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  aria-checked={selected}
                  accessibilityLabel={kind.label}
                  onPress={() => setValue('habitType', kind.value, { shouldDirty: true })}
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderRadius: radius.control,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderColor: selected ? colors.action : colors.line,
                    backgroundColor: selected ? colors.skyWash : 'transparent',
                  }}
                >
                  <Text weight="medium">{kind.label}</Text>
                  <Text variant="small" tone="muted">
                    {kind.hint}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>

        {habitType === 'standard' ? (
          <>
            {text('habitName', 'Habit', 'Read 10 pages')}
            {text('description', 'Note (optional)', 'Before bed')}
          </>
        ) : (
          <>
            {text('trigger', 'When I…', 'pour my morning coffee', true)}
            {text('action', 'I will…', 'write one line in my journal', true)}
          </>
        )}

        <View accessibilityRole="radiogroup" accessibilityLabel="Colour" style={{ gap: 8 }}>
          <Text variant="label">Colour</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {HABIT_COLOURS.map((option) => {
              // a plain variable: Reanimated's Babel plugin mistakes `x.value` in a style for an animated value
              const swatch: string = option.value
              const selected = colour === swatch
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  aria-checked={selected}
                  accessibilityLabel={option.name}
                  onPress={() => setValue('colour', option.value, { shouldDirty: true })}
                  hitSlop={4}
                  style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: swatch, borderWidth: 2, borderColor: selected ? colors.ink : 'transparent' }}
                />
              )
            })}
          </View>
        </View>

        {errors.root && (
          <Text variant="small" tone="danger" role="alert">
            {errors.root.message}
          </Text>
        )}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
          <Button variant="secondary" onPress={onClose}>
            Cancel
          </Button>
          <Button onPress={onSubmit} loading={isSubmitting}>
            {isSubmitting ? 'Saving…' : habit ? 'Save changes' : 'Add habit'}
          </Button>
        </View>
      </View>
    </Sheet>
  )
}
