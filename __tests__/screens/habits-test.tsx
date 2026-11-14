import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import HabitsScreen from '@/app/main/habits';
import { HabitsProvider, useHabits, Habit } from '@/context/HabitsContext';
import { completeHabit } from '@/scripts/services/habitService';
import { ApiError } from '@/scripts/services/apiClient';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));
jest.mock('@/context/UserContext', () => ({
  useUser: () => ({ user: { id: 'u1', token: 'tok', email: 'a@b.c', firstName: 'Kai', lastName: 'L' } }),
}));
// ProgressBar runs an animation loop that keeps firing after the test ends; the "x of y
// completed!" text is what we assert on instead.
jest.mock('react-native-paper', () => ({ ProgressBar: () => null }));
jest.mock('@/scripts/services/habitService', () => ({
  getUserHabits: jest.fn(),
  fetchHabitHistory: jest.fn(() => Promise.resolve([])),
  completeHabit: jest.fn(),
  uncompleteHabit: jest.fn(),
  updateHabit: jest.fn(),
  deleteHabit: jest.fn(),
  createHabit: jest.fn(),
}));

const mockComplete = completeHabit as jest.Mock;

const readHabit: Habit = { id: 'h1', habitName: 'Read', colour: '#A7C7E7', completed: false, habitType: 'standard' };

/** Seeds the real HabitsProvider with habits before rendering the screen. */
function Seed({ habits }: { habits: Habit[] }) {
  const { setHabits } = useHabits();
  React.useEffect(() => setHabits(habits), []);
  return null;
}

function renderScreen(habits: Habit[]) {
  return render(
    <HabitsProvider>
      <Seed habits={habits} />
      <HabitsScreen />
    </HabitsProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

describe('HabitsScreen', () => {
  it('ticks a habit off when the server accepts it', async () => {
    mockComplete.mockResolvedValue(undefined);
    renderScreen([readHabit]);

    const toggle = await screen.findByTestId('habit-switch-h1');
    await act(async () => {
      fireEvent(toggle, 'pressIn');
    });

    expect(mockComplete).toHaveBeenCalledWith('h1', 'tok');
    expect(screen.getByTestId('habit-switch-h1')).toHaveProp('value', true);
    expect(screen.getByText('1 of 1 completed!')).toBeOnTheScreen();
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it('rolls the toggle back and explains why when the server is unreachable', async () => {
    mockComplete.mockRejectedValue(new ApiError('network'));
    renderScreen([readHabit]);

    const toggle = await screen.findByTestId('habit-switch-h1');
    await act(async () => {
      fireEvent(toggle, 'pressIn');
    });

    await waitFor(() => expect(screen.getByTestId('habit-switch-h1')).toHaveProp('value', false));
    expect(screen.getByText('0 of 1 completed!')).toBeOnTheScreen();
    expect(Alert.alert).toHaveBeenCalledWith("Couldn't update habit", expect.stringMatching(/can't reach/i));
  });

  it('shows an empty state when there are no habits', async () => {
    renderScreen([]);

    expect(await screen.findByText(/no habits yet/i)).toBeOnTheScreen();
  });
});
