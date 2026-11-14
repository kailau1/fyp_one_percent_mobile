import { ScrollView, Switch, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Alert, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import BottomNav from '@/components/ui/BottomNav';
import { completeHabit, uncompleteHabit, updateHabit, deleteHabit } from '@/scripts/services/habitService';
import { ProgressBar } from 'react-native-paper';
import { useUser } from '@/context/UserContext';
import { useHabits, Habit } from '@/context/HabitsContext';
import ErrorState from '@/components/ui/ErrorState';
import { getErrorMessage } from '@/scripts/services/apiClient';
import { useRouter } from 'expo-router';
import Divider from '@/components/ui/Divider';
import { Feather } from '@expo/vector-icons';
import HabitModal from '@/components/modals/HabitModal';
import AddHabitModal from '@/components/modals/AddHabitModal';
import HabitHistoryModal from '@/components/modals/HabitHistoryModal';

export default function HabitsScreen() {
  const { user } = useUser();
  const router = useRouter();
  const { habits, setHabits, habitsLoading, habitsError, fetchHabits } = useHabits();
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [selectedColour, setSelectedColour] = useState<string>('');
  const [trigger, setTrigger] = useState('');
  const [action, setAction] = useState('');
  const [isAddHabitVisible, setIsAddHabitVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const colourCodes: string[] = ["#A7C7E7", "#B4E197", "#F8C8DC", "#D6A4E7", "#FDFD96", "#FFD1A9", "#AAF0D1", "#E3D4FC", "#FCA3B7", "#AEEDEE"];

  const handleUpdateHabit = async () => {
    if (!selectedHabit || !user) return;

    const updatedHabit: Habit = {
      ...selectedHabit,
      colour: selectedColour,
      trigger: selectedHabit.habitType === 'trigger-action' ? trigger : undefined,
      action: selectedHabit.habitType === 'trigger-action' ? action : undefined,
    };

    try {
      const updated = await updateHabit(updatedHabit, user.token);
      setHabits((prevHabits) => prevHabits.map((habit) => (habit.id === updated.id ? updated : habit)));
      toggleOverlay();
    } catch (error) {
      Alert.alert("Couldn't update habit", getErrorMessage(error));
    }
  };

  const handleDeleteHabit = async () => {
    if (!selectedHabit || !user) return;

    try {
      await deleteHabit(selectedHabit.id, user.token);
      setHabits((prevHabits) => prevHabits.filter((habit) => habit.id !== selectedHabit.id));
      toggleOverlay();
    } catch (error) {
      Alert.alert("Couldn't delete habit", getErrorMessage(error));
    }
  };

  const setCompleted = (id: string, completed: boolean) =>
    setHabits((prevHabits) => prevHabits.map((habit) => (habit.id === id ? { ...habit, completed } : habit)));

  const handleToggle = async (id: string, completed: boolean) => {
    if (!user) return;
    // Optimistic update: flip immediately, then undo if the server call fails, so the
    // switch never shows a state that wasn't actually saved.
    setCompleted(id, !completed);
    try {
      if (completed) {
        await uncompleteHabit(id, user.token);
      } else {
        await completeHabit(id, user.token);
      }
    } catch (error) {
      setCompleted(id, completed);
      Alert.alert("Couldn't update habit", getErrorMessage(error));
    }
  };

  const toggleOverlay = () => {
    setOverlayVisible(!overlayVisible);
  };

  const openHabitOverlay = (habit: Habit) => {
    if (!habit) return;
    setSelectedHabit(habit);
    setSelectedColour(habit.colour);
    setTrigger(habit.trigger || '');
    setAction(habit.action || '');
    setOverlayVisible(true);
  };

  const handleHabitDescriptionChange = (text: string) => {
    if (selectedHabit) {
      setSelectedHabit({ ...selectedHabit, description: text });
    }
  };

  const handleHabitNameChange = (text: string) => {
    if (selectedHabit) {
      setSelectedHabit({ ...selectedHabit, habitName: text });
    }
  };

  const handleViewHistory = () => {
    setOverlayVisible(false);
    setHistoryModalVisible(true);
  };

  const completedCount = habits ? habits.filter((habit) => habit.completed).length : 0;

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText style={styles.headerText}>Your Habits</ThemedText>
        <TouchableOpacity onPress={() => setIsAddHabitVisible(true)} style={styles.addButton}>
          <Feather name="plus" size={35} color="#74B7E2" />
        </TouchableOpacity>
      </ThemedView>
      <Divider />

      <ThemedView style={styles.progressContainer}>
        <ThemedText style={styles.progressText}>
          {completedCount} of {habits.length} completed!
        </ThemedText>
        <ProgressBar
          progress={habits.length > 0 ? completedCount / habits.length : 0}
          color="#4CAF50"
          style={styles.progressBar}
        />
      </ThemedView>

      {habitsError && (
        <ErrorState
          compact
          testID="habits-error"
          error={habitsError}
          onRetry={() => user?.token && fetchHabits(user.token)}
          retrying={habitsLoading}
        />
      )}

      <ScrollView contentContainerStyle={styles.habitsList}>
        {habits.length === 0 && habitsLoading && <ActivityIndicator color="#74B7E2" testID="habits-loading" />}
        {habits.length === 0 && !habitsLoading && !habitsError && (
          <ThemedText style={styles.emptyText}>No habits yet. Tap + to add your first one.</ThemedText>
        )}
        {habits.map((habit) => (
          <TouchableOpacity
            key={habit.id}
            style={[styles.habitContainer, { backgroundColor: habit.colour }]}
            onPress={() => openHabitOverlay(habit)}
          >
            {habit.habitType === 'trigger-action' ? (
              <ThemedView style={{ backgroundColor: habit.colour }}>
                <ThemedText style={styles.placeholderText}>
                  When I <ThemedText style={styles.userInputText}>{habit.trigger}</ThemedText>
                </ThemedText>
                <ThemedText style={styles.placeholderText}>
                  I will <ThemedText style={styles.userInputText}>{habit.action}</ThemedText>
                </ThemedText>
              </ThemedView>
            ) : (
              <ThemedText style={styles.habitText}>{habit.habitName}</ThemedText>
            )}

            <TouchableWithoutFeedback onPressIn={() => handleToggle(habit.id, habit.completed)}>
              <Switch
                testID={`habit-switch-${habit.id}`}
                trackColor={{ false: '#E0E0E0', true: '#81C784' }}
                thumbColor={habit.completed ? '#4CAF50' : '#FFF'}
                value={habit.completed}
              />
            </TouchableWithoutFeedback>
          </TouchableOpacity>
        ))}

        <ThemedView style={styles.completedToday}>
          <ThemedText style={styles.completedText}>Completed Today</ThemedText>
          {habits
            .filter((habit) => habit.completed)
            .map((habit) => (
              <ThemedView
                key={habit.id}
                style={[styles.habitContainer, { backgroundColor: habit.colour }]}
              >
                {habit.habitType === 'trigger-action' ? (
                  <ThemedView style={{ backgroundColor: habit.colour }}>
                    <ThemedText style={styles.placeholderText}>
                      When I <ThemedText style={styles.userInputText}>{habit.trigger}</ThemedText>
                    </ThemedText>
                    <ThemedText style={styles.placeholderText}>
                      I will <ThemedText style={styles.userInputText}>{habit.action}</ThemedText>
                    </ThemedText>
                  </ThemedView>
                ) : (
                  <ThemedText style={styles.habitText}>{habit.habitName}</ThemedText>
                )}
              </ThemedView>
            ))}
        </ThemedView>
      </ScrollView>

      <HabitModal
        visible={overlayVisible}
        onClose={toggleOverlay}
        onViewHistory={handleViewHistory}
        habit={selectedHabit || undefined}
        trigger={trigger}
        action={action}
        selectedColour={selectedColour}
        colourCodes={colourCodes}
        setSelectedColour={setSelectedColour}
        setTrigger={setTrigger}
        setAction={setAction}
        handleHabitNameChange={handleHabitNameChange}
        handleHabitDescriptionChange={handleHabitDescriptionChange}
        handleUpdateHabit={handleUpdateHabit}
        handleDeleteHabit={handleDeleteHabit}
      />

      <AddHabitModal
        visible={isAddHabitVisible}
        onClose={() => setIsAddHabitVisible(false)}
      />

      <HabitHistoryModal
        visible={historyModalVisible}
        onClose={() => setHistoryModalVisible(false)}
        habitId={selectedHabit?.id || ''}
        token={user?.token || ''}
      />

      <BottomNav />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F9FC',
    position: 'relative',
    marginTop: '15%',
  },
  addButton: {
    position: 'absolute',
    right: 20,
    top: 10,
    color: '#74B7E2',
  },
  headerText: {
    fontSize: 24,
    fontWeight: '600',
    fontFamily: 'Comfortaa_700Bold',
    textAlign: 'center',
  },
  progressContainer: {
    padding: 20,
    backgroundColor: '#F7F9FC',
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: 'Comfortaa_400Regular',
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E0E0E0',
  },
  habitsList: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    paddingBottom: '20%',
  },
  habitContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  emptyText: {
    textAlign: 'center',
    fontFamily: 'Comfortaa_400Regular',
    fontSize: 16,
    marginVertical: 20,
  },
  habitText: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Comfortaa_400Regular',
  },
  completedToday: {
    marginTop: 20,
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#F7F9FC',
    borderRadius: 10,
    width: '100%',
  },
  completedText: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Comfortaa_400Regular',
    marginBottom: 10,
  },
  placeholderText: {
    fontSize: 18,
    fontFamily: 'Comfortaa_700Bold',
    color: '#000',
  },
  userInputText: {
    fontWeight: '600',
    fontSize: 16,
    color: '#000',
    fontFamily: 'Comfortaa_400Regular',
  },
  habitInputContainer: {
    marginTop: '5%',
  },
  colours: {
    flexDirection: 'row',
    height: 70,
    marginBottom: 20,
  },
  colourCircle: {
    borderRadius: 30,
    height: 60,
    width: 60,
    margin: '1%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  overlayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  overlayHeaderText: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Comfortaa_700Bold',
  },
  subHeader: {
    fontSize: 18,
    marginBottom: '1%',
    marginTop: '5%',
    fontFamily: 'Comfortaa_700Bold',
  },
});