import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { getUserJournals, Journal } from '@/scripts/services/journalService';
import { ApiError, toApiError } from '@/scripts/services/apiClient';

export type { Journal };

interface JournalContextProps {
    journals: Journal[];
    setJournals: React.Dispatch<React.SetStateAction<Journal[]>>;
    journalsLoading: boolean;
    /** Set when the last fetch failed. Previously loaded journals are kept. */
    journalsError: ApiError | null;
    /** Loads the user's journals. Never throws: failures land in `journalsError`. */
    fetchJournals: (token: string) => Promise<void>;
}

const JournalsContext = createContext<JournalContextProps | undefined>(undefined);

export const JournalsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [journals, setJournals] = useState<Journal[]>([]);
    const [journalsLoading, setJournalsLoading] = useState(false);
    const [journalsError, setJournalsError] = useState<ApiError | null>(null);

    const fetchJournals = useCallback(async (token: string) => {
        setJournalsLoading(true);
        setJournalsError(null);
        try {
            setJournals(await getUserJournals(token));
        } catch (error) {
            setJournalsError(toApiError(error));
        } finally {
            setJournalsLoading(false);
        }
    }, []);

    return (
        <JournalsContext.Provider value={{ journals, setJournals, journalsLoading, journalsError, fetchJournals }}>
            {children}
        </JournalsContext.Provider>
    );
};

export const useJournals = (): JournalContextProps => {
    const context = useContext(JournalsContext);
    if (!context) {
        throw new Error('useJournals must be used within a JournalsProvider');
    }
    return context;
};
