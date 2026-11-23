import { zodResolver } from '@hookform/resolvers/zod'
import { router } from 'expo-router'
import { useRef, type ComponentRef } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { TextInput, View } from 'react-native'
import { z } from 'zod'
import { getErrorMessage } from '@/api/client'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Text } from '@/components/ui/Text'
import { useTheme } from '@/theme/ThemeProvider'
import { radius } from '@/theme/tokens'
import { AuthLayout } from './AuthLayout'
import { useAuth } from './useAuth'

const schema = z.object({
  email: z.string().trim().min(1, 'Enter your email').email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
})
type FormValues = z.infer<typeof schema>

export function LoginScreen() {
  const { colors } = useTheme()
  const { login, sessionExpired } = useAuth()
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null)
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } })

  // On success there's nothing to do here: the root layout sees the user and shows the app.
  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values)
    } catch (error) {
      setError('root', { message: getErrorMessage(error) })
    }
  })

  return (
    <AuthLayout
      title="Log in"
      footer={
        <>
          <Text tone="muted">New here?</Text>
          <Button variant="link" onPress={() => router.replace('/signup')}>
            Create an account
          </Button>
        </>
      }
    >
      {sessionExpired && (
        <View role="status" style={{ marginBottom: 24, borderRadius: radius.control, borderWidth: 1, borderColor: colors.warningLine, backgroundColor: colors.warningWash, paddingHorizontal: 16, paddingVertical: 12 }}>
          <Text variant="small">Your session expired. Log in again to pick up where you left off.</Text>
        </View>
      )}
      <View style={{ gap: 20 }}>
        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <Field
              label="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.email?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <Field
              ref={passwordRef}
              label="Password"
              secureTextEntry
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={() => onSubmit()}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.password?.message}
            />
          )}
        />
        {errors.root && (
          <Text variant="small" tone="danger" role="alert">
            {errors.root.message}
          </Text>
        )}
        <Button size="lg" onPress={onSubmit} loading={isSubmitting} style={{ alignSelf: 'stretch', marginTop: 8 }}>
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </Button>
      </View>
    </AuthLayout>
  )
}
