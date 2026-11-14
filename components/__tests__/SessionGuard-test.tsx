import React from 'react';
import { Alert } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
import SessionGuard from '@/components/SessionGuard';
import { useUser } from '@/context/UserContext';
import { useHabits } from '@/context/HabitsContext';
import { useJournals } from '@/context/JournalsContext';
import { ApiError } from '@/scripts/services/apiClient';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }) }));
jest.mock('@/context/UserContext', () => ({ useUser: jest.fn() }));
jest.mock('@/context/HabitsContext', () => ({ useHabits: jest.fn() }));
jest.mock('@/context/JournalsContext', () => ({ useJournals: jest.fn() }));

const logout = jest.fn(() => Promise.resolve());
const setHabits = jest.fn();
const setJournals = jest.fn();

function setup(opts: { loggedIn?: boolean; habitsError?: ApiError | null; journalsError?: ApiError | null }) {
  (useUser as jest.Mock).mockReturnValue({ user: opts.loggedIn === false ? null : { id: 'u1', token: 'tok' }, logout });
  (useHabits as jest.Mock).mockReturnValue({ habitsError: opts.habitsError ?? null, setHabits });
  (useJournals as jest.Mock).mockReturnValue({ journalsError: opts.journalsError ?? null, setJournals });
  return render(<SessionGuard />);
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

describe('SessionGuard', () => {
  it('logs out and returns to the landing screen when the server rejects the token', async () => {
    setup({ habitsError: new ApiError('unauthorized') });

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/'));
    expect(logout).toHaveBeenCalledTimes(1);
    expect(setHabits).toHaveBeenCalledWith([]);
    expect(setJournals).toHaveBeenCalledWith([]);
    expect(Alert.alert).toHaveBeenCalledWith('Session expired', expect.any(String));
  });

  it('also reacts to an expired session reported by the journals request', async () => {
    setup({ journalsError: new ApiError('unauthorized') });

    await waitFor(() => expect(logout).toHaveBeenCalled());
  });

  it('does nothing for other errors, such as being offline', () => {
    setup({ habitsError: new ApiError('network'), journalsError: new ApiError('server') });

    expect(logout).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('does nothing when nobody is logged in', () => {
    setup({ loggedIn: false, habitsError: new ApiError('unauthorized') });

    expect(logout).not.toHaveBeenCalled();
  });
});
