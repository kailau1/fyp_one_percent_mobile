import React, { useCallback, useEffect, useState } from 'react';
import { Modal, TouchableOpacity, StyleSheet, View, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useHabits, HabitHistory } from '@/context/HabitsContext';
import { Feather } from '@expo/vector-icons';
import { calculateCurrentStreak, calculateLongestStreak } from '@/scripts/calculateStreak';
import ErrorState from '@/components/ui/ErrorState';
import { ApiError, toApiError } from '@/scripts/services/apiClient';

interface HabitHistoryModalProps {
    visible: boolean;
    onClose: () => void;
    habitId: string;
    token: string;
}

export default function HabitHistoryModal({
    visible,
    onClose,
    habitId,
    token,
}: HabitHistoryModalProps) {
    const { habitHistory, fetchHabitHistory } = useHabits();
    const history: HabitHistory[] = habitHistory[habitId] || [];
    const streak = calculateCurrentStreak(history);
    const longestStreak = calculateLongestStreak(history);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<ApiError | null>(null);

    const load = useCallback(async () => {
        if (!habitId) return;
        setLoading(true);
        setError(null);
        try {
            await fetchHabitHistory(habitId, token);
        } catch (err) {
            setError(toApiError(err));
        } finally {
            setLoading(false);
        }
    }, [fetchHabitHistory, habitId, token]);

    useEffect(() => {
        if (visible) {
            load();
        }
    }, [visible, load]);

    const sortedHistory = [...history].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return (
        <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
            <ThemedView style={styles.modalOverlay}>
                <ThemedView style={styles.modalContainer}>
                    <View style={styles.header}>
                        <ThemedText style={styles.headerText}>Habit History</ThemedText>
                        <TouchableOpacity onPress={onClose}>
                            <Feather name="x" size={24} color="#007AFF" />
                        </TouchableOpacity>
                    </View>
                    {error && <ErrorState compact testID="history-error" error={error} onRetry={load} retrying={loading} />}
                    {loading && history.length === 0 && (
                        <ActivityIndicator color="#007AFF" style={styles.loading} testID="history-loading" />
                    )}
                    {!loading && !error && history.length === 0 && (
                        <ThemedText style={styles.infoText}>
                            No history yet. Complete this habit today to start a streak!
                        </ThemedText>
                    )}
                    <View style={styles.streakSummary}>
                        <View style={styles.streakBox}>
                            <ThemedText style={styles.streakLabel}>Current Streak</ThemedText>
                            <ThemedText style={styles.streakValue} testID="current-streak">{streak}</ThemedText>
                        </View>
                        <View style={styles.streakBox}>
                            <ThemedText style={styles.streakLabel}>Longest Streak</ThemedText>
                            <ThemedText style={styles.streakValue} testID="longest-streak">{longestStreak}</ThemedText>
                        </View>
                    </View>

                    <View style={styles.calendarGrid}>
                        {sortedHistory.map((entry, index) => {
                            const dateObj = new Date(entry.date);
                            const day = dateObj.toLocaleDateString('en-US', { weekday: 'short' }); // Mon, Tue...
                            const dayNum = dateObj.getDate();
                            const isCompleted = entry.completed;

                            return (
                                <View key={index} style={[styles.dayBox, isCompleted ? styles.completed : styles.missed]}>
                                    <ThemedText style={styles.dayLabel}>{day}</ThemedText>
                                    <ThemedText style={styles.dayNum}>{dayNum}</ThemedText>
                                </View>
                            );
                        })}
                    </View>

                </ThemedView>
            </ThemedView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        maxHeight: '80%',
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    headerText: {
        fontSize: 22,
        fontWeight: '700',
        fontFamily: 'Comfortaa_700Bold',
        color: '#333',
    },
    loading: {
        marginVertical: 20,
    },
    historyItem: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    timeline: {
        alignItems: 'center',
        width: 20,
    },
    circle: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#007AFF',
        marginBottom: 2,
    },
    line: {
        width: 2,
        flex: 1,
        backgroundColor: '#007AFF',
    },
    itemContent: {
        marginLeft: 10,
        flex: 1,
        padding: 10,
        backgroundColor: '#F7F9FC',
        borderRadius: 10,
    },
    dayText: {
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Comfortaa_700Bold',
        color: '#333',
    },
    dateText: {
        fontSize: 14,
        fontFamily: 'Comfortaa_400Regular',
        marginBottom: 5,
        color: '#666',
    },
    statusText: {
        fontSize: 16,
        fontFamily: 'Comfortaa_400Regular',
    },
    infoText: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        fontFamily: 'Comfortaa_400Regular',
        color: '#666',
    },
    streakSummary: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
      },
      streakBox: {
        backgroundColor: '#F0F8FF',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
      },
      streakLabel: {
        fontSize: 14,
        color: '#888',
        fontFamily: 'Comfortaa_400Regular',
      },
      streakValue: {
        fontSize: 18,
        fontFamily: 'Comfortaa_700Bold',
        color: '#007AFF',
      },
      calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 12,
      },
      dayBox: {
        width: 60,
        height: 60,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
      },
      completed: {
        backgroundColor: '#D0F0C0',
      },
      missed: {
        backgroundColor: '#F8D7DA',
      },
      dayLabel: {
        fontSize: 12,
        fontFamily: 'Comfortaa_400Regular',
      },
      dayNum: {
        fontSize: 18,
        fontFamily: 'Comfortaa_700Bold',
      },
      
});