import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DashboardScreen from '@/app/main/dashboard';
import { useHabits } from '@/context/HabitsContext';
import { fetchTipOfTheDay } from '@/scripts/services/openaiService';
import { ApiError } from '@/scripts/services/apiClient';

// Screen tests live outside app/ because Expo Router treats every file in app/ as a route.

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));
jest.mock('@/context/UserContext', () => ({
  useUser: () => ({ user: { id: 'u1', token: 'tok', email: 'a@b.c', firstName: 'Kai', lastName: 'L' } }),
}));
jest.mock('@/context/HabitsContext', () => ({ useHabits: jest.fn() }));
jest.mock('@/scripts/services/openaiService', () => ({ fetchTipOfTheDay: jest.fn() }));

const mockUseHabits = useHabits as jest.Mock;
const mockTip = fetchTipOfTheDay as jest.Mock;

function habitsState(overrides: object = {}) {
  return { habits: [], habitsLoading: false, habitsError: null, fetchHabits: jest.fn(), ...overrides };
}

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  mockTip.mockResolvedValue({ error: '', response: 'Make your environment your ally.' });
});

describe('DashboardScreen', () => {
  it('greets the user and shows the tip of the day', async () => {
    mockUseHabits.mockReturnValue(habitsState());

    render(<DashboardScreen />);

    expect(screen.getByText('Kai')).toBeOnTheScreen();
    expect(await screen.findByText('Make your environment your ally.')).toBeOnTheScreen();
    expect(screen.getByText(/no habits yet/i)).toBeOnTheScreen();
  });

  it('shows a retryable offline error instead of "no habits" when habits failed to load', async () => {
    const fetchHabits = jest.fn();
    mockUseHabits.mockReturnValue(habitsState({ habitsError: new ApiError('network'), fetchHabits }));

    render(<DashboardScreen />);

    const banner = await screen.findByTestId('habits-error');
    expect(within(banner).getByText(/can't reach/i)).toBeOnTheScreen();
    expect(screen.queryByText(/no habits yet/i)).toBeNull();

    fireEvent.press(within(banner).getByRole('button', { name: 'Try again' }));
    expect(fetchHabits).toHaveBeenCalledWith('tok');
  });

  it('keeps showing cached habits alongside the error banner', async () => {
    mockUseHabits.mockReturnValue(
      habitsState({
        habits: [{ id: 'h1', habitName: 'Read 10 pages', colour: '#fff', completed: false, habitType: 'standard' }],
        habitsError: new ApiError('timeout'),
      }),
    );

    render(<DashboardScreen />);

    expect(await screen.findByTestId('habits-error')).toBeOnTheScreen();
    expect(screen.getByText('Read 10 pages')).toBeOnTheScreen();
  });

  it('shows a loading indicator while habits load for the first time', async () => {
    mockUseHabits.mockReturnValue(habitsState({ habitsLoading: true }));

    render(<DashboardScreen />);

    expect(screen.getByTestId('habits-loading')).toBeOnTheScreen();
    await screen.findByText('Make your environment your ally.');
  });

  it('lets the user retry a failed tip, bypassing the cache', async () => {
    mockUseHabits.mockReturnValue(habitsState());
    mockTip
      .mockResolvedValueOnce({ error: "Can't reach the One Percent server.", offline: true, response: '' })
      .mockResolvedValueOnce({ error: '', response: 'Fresh tip' });

    render(<DashboardScreen />);

    const banner = await screen.findByTestId('tip-error');
    fireEvent.press(within(banner).getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Fresh tip')).toBeOnTheScreen();
    expect(mockTip).toHaveBeenCalledTimes(2);
  });

  it('uses the cached tip when it is from today', async () => {
    mockUseHabits.mockReturnValue(habitsState());
    await AsyncStorage.setItem('tipOfTheDay', 'Cached tip');
    await AsyncStorage.setItem('tipOfTheDayDate', new Date().toISOString().split('T')[0]);

    render(<DashboardScreen />);

    expect(await screen.findByText('Cached tip')).toBeOnTheScreen();
    expect(mockTip).not.toHaveBeenCalled();
  });
});
