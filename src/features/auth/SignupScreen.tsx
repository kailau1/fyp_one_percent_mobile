import { zodResolver } from '@hookform/resolvers/zod'
import { router } from 'expo-router'
import { Controller, useForm, type Control, type FieldPath } from 'react-hook-form'
import { View, type TextInputProps } from 'react-native'
import { z } from 'zod'
import { getErrorMessage } from '@/api/client'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Text } from '@/components/ui/Text'
import { AuthLayout } from './AuthLayout'
import { useAuth } from './useAuth'

const schema = z.object({
  firstName: z.string().trim().min(1, 'Enter your first name'),
  lastName: z.string().trim().min(1, 'Enter your last name'),
  email: z.string().trim().min(1, 'Enter your email').email('Enter a valid email address'),
  password: z.string().min(8, 'Use at least 8 characters'),
})
type FormValues = z.infer<typeof schema>

function FormField({
  control,
  name,
  label,
  error,
  hint,
  ...input
}: { control: Control<FormValues>; name: FieldPath<FormValues>; label: string; error?: string; hint?: string } & TextInputProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Field label={label} value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} error={error} hint={hint} {...input} />
      )}
    />
  )
}

export function SignupScreen() {
  const { register: createAccount } = useAuth()
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { firstName: '', lastName: '', email: '', password: '' } })

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createAccount(values)
    } catch (error) {
      const message = getErrorMessage(error)
      // "An account with this email already exists." belongs next to the email field
      if (/email/i.test(message)) setError('email', { message })
      else setError('root', { message })
    }
  })

  return (
    <AuthLayout
      title="Create your account"
      footer={
        <>
          <Text tone="muted">Already have an account?</Text>
          <Button variant="link" onPress={() => router.replace('/login')}>
            Log in
          </Button>
        </>
      }
    >
      <View style={{ gap: 20 }}>
        <FormField control={control} name="firstName" label="First name" autoComplete="given-name" textContentType="givenName" error={errors.firstName?.message} />
        <FormField control={control} name="lastName" label="Last name" autoComplete="family-name" textContentType="familyName" error={errors.lastName?.message} />
        <FormField
          control={control}
          name="email"
          label="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          error={errors.email?.message}
        />
        <FormField
          control={control}
          name="password"
          label="Password"
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          hint="At least 8 characters"
          error={errors.password?.message}
        />
        {errors.root && (
          <Text variant="small" tone="danger" role="alert">
            {errors.root.message}
          </Text>
        )}
        <Button size="lg" onPress={onSubmit} loading={isSubmitting} style={{ alignSelf: 'stretch', marginTop: 8 }}>
          {isSubmitting ? 'Creating your account…' : 'Create account'}
        </Button>
      </View>
    </AuthLayout>
  )
}
