import { apiRequest } from './apiClient';

// All functions throw an ApiError on failure. Callers decide how to show it.

export interface Journal {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    llmResponse?: string;
}

export const createJournal = (
    title: string,
    content: string,
    token: string,
    llmResponse?: string,
): Promise<Journal> =>
    apiRequest<Journal>('/api/journals', { method: 'POST', token, body: { title, content, llmResponse } });

export const getUserJournals = async (token: string): Promise<Journal[]> =>
    (await apiRequest<Journal[]>('/api/journals/me', { token })) ?? [];

export const deleteJournalEntry = async (journalId: string, token: string): Promise<void> => {
    await apiRequest(`/api/journals/${journalId}`, { method: 'DELETE', token });
};

export const getJournalEntry = (journalId: string, token: string): Promise<Journal> =>
    // the backend serves single entries under /entry/{id}; this used to call /api/journals/{id}
    apiRequest<Journal>(`/api/journals/entry/${journalId}`, { token });

export const updateJournalEntry = (
    id: string,
    title: string,
    content: string,
    token: string,
    llmResponse: string,
): Promise<Journal> =>
    apiRequest<Journal>('/api/journals/entry', { method: 'PUT', token, body: { id, title, content, llmResponse } });
