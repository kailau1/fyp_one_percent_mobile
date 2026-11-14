import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import {
    getUserHabits,
    fetchHabitHistory as fetchHabitHistoryAPI,
    Habit,
    HabitHistory,
} from '@/scripts/services/habitService';
import { ApiError, toApiError } from '@/scripts/services/apiClient';

// One definition of these types, shared with the service layer.
export type { Habit, HabitHistory };

interface HabitsContextProps {
    habits: Habit[];
    setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
    /** True while the habit list is being fetched. */
    habitsLoading: boolean;
    /** Set when the last fetch failed. Any previously loaded habits are kept on screen. */
    habitsError: ApiError | null;
    /** Loads the user's habits. Never throws: failures land in `habitsError`. */
    fetchHabits: (token: string) => Promise<void>;

    habitHistory: Record<string, HabitHistory[]>;
    /** Loads and caches one habit's history. Throws ApiError so the caller can show it. */
    fetchHabitHistory: (habitId: string, token: string) => Promise<void>;
}

const HabitsContext = createContext<HabitsContextProps | undefined>(undefined);

export const HabitsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [habits, setHabits] = useState<Habit[]>([]);
    const [habitsLoading, setHabitsLoading] = useState(false);
    const [habitsError, setHabitsError] = useState<ApiError | null>(null);
    const [habitHistory, setHabitHistory] = useState<Record<string, HabitHistory[]>>({});

    const fetchHabits = useCallback(async (token: string) => {
        setHabitsLoading(true);
        setHabitsError(null);
        try {
            setHabits(await getUserHabits(token));
        } catch (error) {
            setHabitsError(toApiError(error));
        } finally {
            setHabitsLoading(false);
        }
    }, []);

    const fetchHabitHistory = useCallback(async (habitId: string, token: string) => {
        const history = await fetchHabitHistoryAPI(habitId, token);
        setHabitHistory((prev) => ({ ...prev, [habitId]: history }));
    }, []);

    return (
        <HabitsContext.Provider
            value={{ habits, setHabits, habitsLoading, habitsError, fetchHabits, habitHistory, fetchHabitHistory }}
        >
            {children}
        </HabitsContext.Provider>
    );
};

export const useHabits = (): HabitsContextProps => {
    const context = useContext(HabitsContext);
    if (!context) {
        throw new Error('useHabits must be used within a HabitsProvider');
    }
    return context;
};
