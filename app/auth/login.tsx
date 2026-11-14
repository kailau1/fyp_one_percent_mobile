import { StyleSheet, Text, ActivityIndicator } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import ButtonCTA from '@/components/ui/ButtonCTA';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import InputFieldIcon from '@/components/InputFieldIcon';
import { loginUser } from '@/scripts/services/userService';
import { getErrorMessage } from '@/scripts/services/apiClient';
import Header from '@/components/Header-Sub';
import { useUser } from '@/context/UserContext';
import { useHabits } from '@/context/HabitsContext';
import { useJournals } from '@/context/JournalsContext';

export default function LoginScreen() {
  const router = useRouter();
  const colourScheme = useColorScheme();
  const iconColour = colourScheme === 'dark' ? '#fff' : '#000';
  const { setUser } = useUser();
  const { fetchHabits } = useHabits();
  const { fetchJournals } = useJournals();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string | null }>({});
  const [loading, setLoading] = useState(false);

  const validateInputs = () => {
    const newErrors: typeof errors = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    if (!password.trim()) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const callLoginUser = async () => {
    if (!validateInputs()) return;
    setLoading(true);
    try {
      const loggedInUser = await loginUser(email.trim(), password);
      setUser(loggedInUser);
      // previously nothing was loaded after login, so habits/journals were empty until a restart
      fetchHabits(loggedInUser.token);
      fetchJournals(loggedInUser.token);
      router.replace('/main/dashboard');
    } catch (error) {
      // e.g. "Incorrect email or password." vs "Can't reach the One Percent server…"
      setErrors((prev) => ({ ...prev, general: getErrorMessage(error) }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Header title="Enter your details" onBackPress={() => router.back()} iconColour={iconColour} />
      <InputFieldIcon
        placeholder="Enter your email"
        icon="mail"
        autoCapitalize="none"
        keyboardType="email-address"
        onChangeText={newText => setEmail(newText)}
      />
      <InputFieldIcon
        placeholder="Password"
        icon="key"
        secureTextEntry={true}
        onChangeText={newText => setPassword(newText)}
      />
      <ThemedView style={styles.errorContainer}>
        {errors.email && <Text style={styles.errorText}>* {errors.email}</Text>}
        {errors.password && <Text style={styles.errorText}>* {errors.password}</Text>}
        {errors.general && <Text style={styles.errorText} testID="login-error">* {errors.general}</Text>}
      </ThemedView>
      <ThemedView style={styles.buttonContainer}>
        {loading && <ActivityIndicator color="#74B7E2" style={styles.spinner} />}
        <ButtonCTA onPress={callLoginUser} title={loading ? 'Logging in…' : 'Login'} disabled={loading} />
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 10,
    position: 'relative',
    height: '100%',
  },
  buttonContainer: {
    alignItems: 'center',
    width: '60%',
    position: 'absolute',
    bottom: 0,
    marginBottom: '4%',
  },
  spinner: {
    marginBottom: 10,
  },
  errorContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '90%',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginTop: 5,
  },
});
