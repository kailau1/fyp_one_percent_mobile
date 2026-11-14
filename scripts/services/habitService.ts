import { apiRequest } from './apiClient';

// All functions throw an ApiError on failure. Callers decide how to show it.

export interface Habit {
    id: string;
    habitName?: string;
    description?: string;
    completed: boolean;
    colour: string;
    habitType: 'standard' | 'trigger-action';
    trigger?: string;
    action?: string;
}

export interface HabitHistory {
    date: string;
    completed: boolean;
}

export const createHabit = (
    userId: string,
    habitName: string,
    description: string,
    completed: boolean,
    colour: string,
    token: string,
    habitType: 'standard' | 'trigger-action',
    trigger?: string,
    action?: string,
): Promise<Habit> =>
    apiRequest<Habit>('/api/habits/create', {
        method: 'POST',
        token,
        body: { userId, habitName, description, completed, colour, habitType, trigger, action },
    });

export const getUserHabits = async (token: string): Promise<Habit[]> =>
    (await apiRequest<Habit[]>('/api/habits/me', { token })) ?? [];

export const completeHabit = async (habitId: string, token: string): Promise<void> => {
    await apiRequest(`/api/habit-history/complete/${habitId}`, { method: 'POST', token });
};

export const uncompleteHabit = async (habitId: string, token: string): Promise<void> => {
    await apiRequest(`/api/habit-history/uncomplete/${habitId}`, { method: 'POST', token });
};

export const updateHabit = (habit: Habit, token: string): Promise<Habit> =>
    apiRequest<Habit>('/api/habits/update', {
        method: 'PUT',
        token,
        body: {
            id: habit.id,
            habitName: habit.habitName,
            description: habit.description,
            colour: habit.colour,
            // The backend overwrites every field, so leaving this out used to un-tick
            // today's habit whenever you edited it.
            completed: habit.completed,
            habitType: habit.habitType,
            trigger: habit.trigger,
            action: habit.action,
        },
    });

export const deleteHabit = async (habitId: string, token: string): Promise<void> => {
    await apiRequest(`/api/habits/delete/${habitId}`, { method: 'DELETE', token });
};

export const fetchHabitHistory = async (habitId: string, token: string): Promise<HabitHistory[]> =>
    (await apiRequest<HabitHistory[]>(`/api/habit-history/${habitId}`, { token })) ?? [];
