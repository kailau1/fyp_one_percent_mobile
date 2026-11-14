import { AI_TIMEOUT_MS, apiRequest, toApiError } from './apiClient';

/** Failure details for the { error, ... } results below. */
function failure(error: unknown): { error: string; offline: boolean } {
    const apiError = toApiError(error);
    return { error: apiError.message, offline: apiError.isOffline };
}

// These keep the original { error, ... } return shape (callers check `error`), but the
// error is now a message that is safe to show the user, plus `offline` when the server
// couldn't be reached.

export const fetchOpenAIResponse = async (
    journalId: string,
    journalContent: string,
    token: string,
): Promise<{ error: string; offline?: boolean; response: string }> => {
    try {
        // The user comes from the token on the server, so no userId is sent.
        const data = await apiRequest<{ response?: string }>('/api/ai/feedback', {
            method: 'POST',
            token,
            body: { journalId: journalId || null, journalContent },
            timeoutMs: AI_TIMEOUT_MS,
        });
        return { error: '', response: data?.response ?? '' };
    } catch (error) {
        return { ...failure(error), response: '' };
    }
};

export const fetchTipOfTheDay = async (token: string): Promise<{ error: string; offline?: boolean; response: string }> => {
    try {
        const data = await apiRequest<{ response?: string }>('/api/ai/tip', { token, timeoutMs: AI_TIMEOUT_MS });
        return { error: '', response: data?.response ?? '' };
    } catch (error) {
        return { ...failure(error), response: '' };
    }
};

export const fetchJournalingPrompts = async (
    token: string,
    userId: string,
): Promise<{ error: string; offline?: boolean; prompts: string[] }> => {
    try {
        const data = await apiRequest<unknown>(`/api/ai/prompt/${userId}`, { token, timeoutMs: AI_TIMEOUT_MS });
        if (!Array.isArray(data)) {
            return { error: 'The server sent prompts in an unexpected format.', prompts: [] };
        }
        return { error: '', prompts: data.filter((p): p is string => typeof p === 'string' && p.trim() !== '') };
    } catch (error) {
        return { ...failure(error), prompts: [] };
    }
};
