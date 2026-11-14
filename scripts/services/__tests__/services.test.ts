import AsyncStorage from '@react-native-async-storage/async-storage';
import * as habits from '@/scripts/services/habitService';
import * as journals from '@/scripts/services/journalService';
import * as ai from '@/scripts/services/openaiService';
import * as users from '@/scripts/services/userService';
import { fakeJwt, fetchCall, installFetchMock, mockResponse } from '@/test-utils/fetchMock';

let fetchMock: jest.Mock;

beforeEach(() => {
  fetchMock = installFetchMock();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

const ok = (body?: unknown) => fetchMock.mockResolvedValueOnce(mockResponse(200, body));
const offline = () => fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));

describe('habitService', () => {
  const habit: habits.Habit = { id: 'h1', habitName: 'Read', colour: '#fff', completed: true, habitType: 'standard' };

  it('lists the current user\'s habits', async () => {
    ok([habit]);
    await expect(habits.getUserHabits('tok')).resolves.toEqual([habit]);
    expect(fetchCall(fetchMock).url).toBe('http://api.test/api/habits/me');
  });

  it('treats an empty body as no habits', async () => {
    ok();
    await expect(habits.getUserHabits('tok')).resolves.toEqual([]);
  });

  it('creates a habit with the fields the backend expects', async () => {
    ok(habit);
    await habits.createHabit('u1', 'Read', 'Daily', false, '#fff', 'tok', 'standard');

    const { url, init, body } = fetchCall(fetchMock);
    expect(url).toBe('http://api.test/api/habits/create');
    expect(init.method).toBe('POST');
    expect(body).toMatchObject({ habitName: 'Read', description: 'Daily', completed: false, colour: '#fff', habitType: 'standard' });
  });

  it('sends completed when updating, so editing a habit doesn\'t un-tick it', async () => {
    ok(habit);
    await habits.updateHabit(habit, 'tok');

    expect(fetchCall(fetchMock).init.method).toBe('PUT');
    expect(fetchCall(fetchMock).body).toMatchObject({ id: 'h1', completed: true });
  });

  it('completes, uncompletes and deletes via the right endpoints', async () => {
    ok(); ok(); fetchMock.mockResolvedValueOnce(mockResponse(204));

    await habits.completeHabit('h1', 'tok');
    await habits.uncompleteHabit('h1', 'tok');
    await habits.deleteHabit('h1', 'tok');

    expect(fetchCall(fetchMock, 0).url).toBe('http://api.test/api/habit-history/complete/h1');
    expect(fetchCall(fetchMock, 1).url).toBe('http://api.test/api/habit-history/uncomplete/h1');
    expect(fetchCall(fetchMock, 2)).toMatchObject({ url: 'http://api.test/api/habits/delete/h1', init: { method: 'DELETE' } });
  });

  it('fetches a habit\'s history', async () => {
    ok([{ date: '2025-04-20', completed: true }]);
    await expect(habits.fetchHabitHistory('h1', 'tok')).resolves.toHaveLength(1);
    expect(fetchCall(fetchMock).url).toBe('http://api.test/api/habit-history/h1');
  });

  it('throws instead of quietly returning an empty list when offline', async () => {
    offline();
    await expect(habits.getUserHabits('tok')).rejects.toMatchObject({ kind: 'network' });
  });

  it('throws when a toggle fails so the UI can roll back', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(500));
    await expect(habits.completeHabit('h1', 'tok')).rejects.toMatchObject({ kind: 'server' });
  });
});

describe('journalService', () => {
  it('fetches a single entry from /entry/{id}', async () => {
    ok({ id: 'j1' });
    await journals.getJournalEntry('j1', 'tok');
    expect(fetchCall(fetchMock).url).toBe('http://api.test/api/journals/entry/j1');
  });

  it('creates, updates, lists and deletes', async () => {
    ok({ id: 'j1' }); ok({ id: 'j1' }); ok([]); fetchMock.mockResolvedValueOnce(mockResponse(204));

    await journals.createJournal('T', 'C', 'tok', 'feedback');
    await journals.updateJournalEntry('j1', 'T2', 'C2', 'tok', 'fb');
    await journals.getUserJournals('tok');
    await journals.deleteJournalEntry('j1', 'tok');

    expect(fetchCall(fetchMock, 0)).toMatchObject({ url: 'http://api.test/api/journals', body: { title: 'T', content: 'C', llmResponse: 'feedback' } });
    expect(fetchCall(fetchMock, 1)).toMatchObject({ url: 'http://api.test/api/journals/entry', init: { method: 'PUT' }, body: { id: 'j1' } });
    expect(fetchCall(fetchMock, 2).url).toBe('http://api.test/api/journals/me');
    expect(fetchCall(fetchMock, 3)).toMatchObject({ url: 'http://api.test/api/journals/j1', init: { method: 'DELETE' } });
  });

  it('surfaces "not found" (e.g. another user\'s entry) as an error', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(404, 'Journal entry not found: j9'));
    await expect(journals.getJournalEntry('j9', 'tok')).rejects.toMatchObject({ kind: 'notFound' });
  });
});

describe('openaiService', () => {
  it('returns feedback and no longer sends a userId', async () => {
    ok({ response: 'Nice work' });

    await expect(ai.fetchOpenAIResponse('', 'my entry', 'tok')).resolves.toEqual({ error: '', response: 'Nice work' });
    expect(fetchCall(fetchMock).body).toEqual({ journalId: null, journalContent: 'my entry' });
  });

  it('reports an offline failure with a friendly message', async () => {
    offline();

    const result = await ai.fetchOpenAIResponse('j1', 'x', 'tok');

    expect(result.response).toBe('');
    expect(result.offline).toBe(true);
    expect(result.error).toMatch(/can't reach/i);
  });

  it('returns the tip of the day', async () => {
    ok({ response: 'Leave your journal on your pillow.' });
    await expect(ai.fetchTipOfTheDay('tok')).resolves.toEqual({ error: '', response: 'Leave your journal on your pillow.' });
  });

  it('flags a server error on the tip as not-offline', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(500));
    await expect(ai.fetchTipOfTheDay('tok')).resolves.toMatchObject({ offline: false, response: '' });
  });

  it('returns prompts without blank lines', async () => {
    ok(['What drained you today?', '  ', 'What are you proud of?']);

    const result = await ai.fetchJournalingPrompts('tok', 'u1');

    expect(fetchCall(fetchMock).url).toBe('http://api.test/api/ai/prompt/u1');
    expect(result).toEqual({ error: '', prompts: ['What drained you today?', 'What are you proud of?'] });
  });

  it('rejects a prompts response that is not a list', async () => {
    ok({ prompts: 'nope' });
    await expect(ai.fetchJournalingPrompts('tok', 'u1')).resolves.toMatchObject({ prompts: [], error: expect.stringMatching(/unexpected/) });
  });
});

describe('userService', () => {
  const token = fakeJwt({ userId: 'u1', email: 'kai@example.com', firstName: 'Kai', lastName: 'L' });

  beforeEach(() => AsyncStorage.clear());

  it('logs in, decodes the user from the token and stores the session', async () => {
    ok({ token });

    const user = await users.loginUser('kai@example.com', 'pw');

    expect(user).toEqual({ id: 'u1', email: 'kai@example.com', firstName: 'Kai', lastName: 'L', token });
    expect(JSON.parse((await AsyncStorage.getItem('user'))!)).toEqual(user);
    expect(fetchCall(fetchMock).init.headers).not.toHaveProperty('Authorization');
  });

  it('says "incorrect email or password" for a 401, not "session expired"', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(401));

    await expect(users.loginUser('kai@example.com', 'bad')).rejects.toThrow('Incorrect email or password.');
    expect(await AsyncStorage.getItem('user')).toBeNull();
  });

  it('lets an offline error through unchanged', async () => {
    offline();
    await expect(users.loginUser('kai@example.com', 'pw')).rejects.toMatchObject({ kind: 'network' });
  });

  it('registers then logs in, so a new user ends up with a token', async () => {
    ok({ id: 'u1', email: 'kai@example.com' });
    ok({ token });

    const user = await users.registerAndLogin('kai@example.com', 'Kai', 'L', 'pw');

    expect(fetchCall(fetchMock, 0).url).toBe('http://api.test/api/users/register');
    expect(fetchCall(fetchMock, 1).url).toBe('http://api.test/api/users/login');
    expect(user.token).toBe(token);
  });

  it('shows the duplicate-email message and skips login', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(400, 'An account with this email already exists.'));

    await expect(users.registerAndLogin('kai@example.com', 'Kai', 'L', 'pw')).rejects.toThrow('An account with this email already exists.');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
