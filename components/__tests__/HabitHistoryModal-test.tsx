import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import HabitHistoryModal from '@/components/modals/HabitHistoryModal';
import { HabitsProvider } from '@/context/HabitsContext';
import { fetchHabitHistory } from '@/scripts/services/habitService';
import { ApiError } from '@/scripts/services/apiClient';

jest.mock('@/scripts/services/habitService', () => ({
  getUserHabits: jest.fn(),
  fetchHabitHistory: jest.fn(),
}));

const mockFetchHistory = fetchHabitHistory as jest.Mock;

function ymd(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function renderModal() {
  return render(
    <HabitsProvider>
      <HabitHistoryModal visible onClose={jest.fn()} habitId="h1" token="tok" />
    </HabitsProvider>,
  );
}

beforeEach(() => mockFetchHistory.mockReset());

describe('HabitHistoryModal', () => {
  it('loads the history and shows current and longest streaks', async () => {
    mockFetchHistory.mockResolvedValue([
      { date: ymd(0), completed: true },
      { date: ymd(1), completed: true },
      { date: ymd(3), completed: true },
      { date: ymd(4), completed: true },
      { date: ymd(5), completed: true },
    ]);

    renderModal();

    expect(await screen.findByTestId('current-streak')).toHaveTextContent('2');
    expect(screen.getByTestId('longest-streak')).toHaveTextContent('3');
    expect(mockFetchHistory).toHaveBeenCalledWith('h1', 'tok');
  });

  it('shows an empty state for a habit with no history', async () => {
    mockFetchHistory.mockResolvedValue([]);

    renderModal();

    expect(await screen.findByText(/no history yet/i)).toBeOnTheScreen();
  });

  it('shows an error when offline and recovers on retry', async () => {
    mockFetchHistory
      .mockRejectedValueOnce(new ApiError('network'))
      .mockResolvedValueOnce([{ date: ymd(0), completed: true }]);

    renderModal();

    expect(await screen.findByTestId('history-error')).toBeOnTheScreen();
    expect(screen.getByText(/can't reach/i)).toBeOnTheScreen();

    fireEvent.press(screen.getByRole('button', { name: 'Try again' }));

    await waitFor(() => expect(screen.queryByTestId('history-error')).toBeNull());
    expect(screen.getByTestId('current-streak')).toHaveTextContent('1');
    expect(mockFetchHistory).toHaveBeenCalledTimes(2);
  });
});
