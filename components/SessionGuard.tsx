import { useEffect } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@/context/UserContext';
import { useHabits } from '@/context/HabitsContext';
import { useJournals } from '@/context/JournalsContext';

/**
 * Login tokens expire (the server answers 401). When that happens there is nothing the user can
 * do from inside the app, so this clears the session and sends them back to the landing screen
 * to log in again. Renders nothing; mounted once inside the providers in app/_layout.tsx.
 */
export default function SessionGuard() {
  const router = useRouter();
  const { user, logout } = useUser();
  const { habitsError, setHabits } = useHabits();
  const { journalsError, setJournals } = useJournals();

  const sessionExpired = habitsError?.kind === 'unauthorized' || journalsError?.kind === 'unauthorized';

  useEffect(() => {
    if (!user || !sessionExpired) return;

    (async () => {
      await logout();
      setHabits([]);
      setJournals([]);
      Alert.alert('Session expired', 'Please log in again.');
      router.replace('/');
    })();
  }, [user, sessionExpired, logout, setHabits, setJournals, router]);

  return null;
}
