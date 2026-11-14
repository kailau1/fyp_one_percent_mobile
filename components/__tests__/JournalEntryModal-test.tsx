import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import JournalEntryScreen from '@/components/modals/JournalEntryModal';
import { JournalsProvider } from '@/context/JournalsContext';
import { createJournal, getUserJournals } from '@/scripts/services/journalService';
import { fetchOpenAIResponse } from '@/scripts/services/openaiService';
import { ApiError } from '@/scripts/services/apiClient';

jest.mock('@/context/UserContext', () => ({
  useUser: () => ({ user: { id: 'u1', token: 'tok', email: 'a@b.c', firstName: 'Kai', lastName: 'L' }, setUser: jest.fn() }),
}));
jest.mock('@/scripts/services/journalService', () => ({
  createJournal: jest.fn(),
  updateJournalEntry: jest.fn(),
  getUserJournals: jest.fn(),
}));
jest.mock('@/scripts/services/openaiService', () => ({
  fetchOpenAIResponse: jest.fn(),
}));

const mockCreate = createJournal as jest.Mock;
const mockFeedback = fetchOpenAIResponse as jest.Mock;

function renderNewEntry() {
  const onClose = jest.fn();
  render(
    <JournalsProvider>
      <JournalEntryScreen onClose={onClose} journalId={null} />
    </JournalsProvider>,
  );
  fireEvent.changeText(screen.getByPlaceholderText('Title'), 'Tough day');
  fireEvent.changeText(screen.getByPlaceholderText('Write your journal entry...'), 'I kept putting things off.');
  return { onClose };
}

beforeEach(() => {
  jest.clearAllMocks();
  (getUserJournals as jest.Mock).mockResolvedValue([]);
});

describe('JournalEntryModal saving', () => {
  it('saves and closes on success', async () => {
    mockCreate.mockResolvedValue({ id: 'j1' });
    const { onClose } = renderNewEntry();

    fireEvent.press(screen.getByText('Done'));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mockCreate).toHaveBeenCalledWith('Tough day', 'I kept putting things off.', 'tok', '');
  });

  it('stays open and keeps the text when saving fails offline', async () => {
    mockCreate.mockRejectedValueOnce(new ApiError('network'));
    const { onClose } = renderNewEntry();

    fireEvent.press(screen.getByText('Done'));

    expect(await screen.findByTestId('save-error')).toBeOnTheScreen();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByDisplayValue('I kept putting things off.')).toBeOnTheScreen();
  });

  it('can retry a failed save from the error banner', async () => {
    mockCreate.mockRejectedValueOnce(new ApiError('timeout')).mockResolvedValueOnce({ id: 'j1' });
    const { onClose } = renderNewEntry();

    fireEvent.press(screen.getByText('Done'));
    fireEvent.press(await screen.findByRole('button', { name: 'Try again' }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });
});

describe('JournalEntryModal AI feedback', () => {
  it('offers "View Feedback" once feedback arrives', async () => {
    mockFeedback.mockResolvedValue({ error: '', response: 'Try the two-minute rule.' });
    renderNewEntry();

    fireEvent.press(screen.getByText('Get Feedback'));

    expect(await screen.findByText('View Feedback')).toBeOnTheScreen();
    expect(mockFeedback).toHaveBeenCalledWith('', 'I kept putting things off.', 'tok');
  });

  it('shows a feedback error without saving it into the journal as feedback', async () => {
    mockFeedback.mockResolvedValue({ error: "Can't reach the One Percent server.", offline: true, response: '' });
    mockCreate.mockResolvedValue({ id: 'j1' });
    renderNewEntry();

    fireEvent.press(screen.getByText('Get Feedback'));

    expect(await screen.findByTestId('feedback-error')).toBeOnTheScreen();
    expect(screen.getByText('Get Feedback')).toBeOnTheScreen(); // not "View Feedback"

    fireEvent.press(screen.getByText('Done'));
    await waitFor(() => expect(mockCreate).toHaveBeenCalled());
    expect(mockCreate.mock.calls[0][3]).toBe(''); // llmResponse stays empty
  });
});
