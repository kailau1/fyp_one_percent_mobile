import React, { useState, useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  View,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import BottomNav from '@/components/ui/BottomNav';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import Divider from '@/components/ui/Divider';
import JournalEntryScreen from '@/components/modals/JournalEntryModal';
import { useJournals } from '@/context/JournalsContext';
import { useUser } from '@/context/UserContext';
import { deleteJournalEntry } from '@/scripts/services/journalService';
import { MaterialIcons } from '@expo/vector-icons';
import { fetchJournalingPrompts } from '@/scripts/services/openaiService';
import ErrorState from '@/components/ui/ErrorState';
import { ApiError, getErrorMessage } from '@/scripts/services/apiClient';


export default function JournalScreen() {
  const { journals, setJournals, journalsLoading, journalsError, fetchJournals } = useJournals();
  const { user } = useUser();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalStep, setModalStep] = useState<'picker' | 'entry'>('picker');
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [selectedJournalId, setSelectedJournalId] = useState<string | null>(null);
  const [optionsVisible, setOptionsVisible] = useState<string | null>(null);
  const [journalMode, setJournalMode] = useState<'blank' | 'prompt'>('blank');
  const { openModal, option, step } = useLocalSearchParams();
  const [promptOptions, setPromptOptions] = useState<string[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [promptsError, setPromptsError] = useState<ApiError | null>(null);


  useEffect(() => {
    if (openModal === 'true') {
      if (option === 'blank') {
        openBlankJournal();
      } else if (option === 'prompt' && step === 'picker') {
        openPromptJournal();
      }
    }
    return () => {
    };
  }, [openModal, option, step]);


  const handleDeleteJournal = async (journalId: string) => {
    if (!user) return;
    setOptionsVisible(null);
    try {
      await deleteJournalEntry(journalId, user.token);
      setJournals((prev) => prev.filter((j) => j.id !== journalId));
    } catch (error) {
      Alert.alert("Couldn't delete entry", getErrorMessage(error));
    }
  };

  const loadPrompts = async () => {
    if (!user?.token) return;
    setLoadingPrompts(true);
    setPromptsError(null);
    const { error, offline, prompts } = await fetchJournalingPrompts(user.token, user.id);
    setLoadingPrompts(false);

    if (error) {
      setPromptsError(new ApiError(offline ? 'network' : 'unknown', error));
    } else {
      setPromptOptions(prompts);
    }
  };

  const openBlankJournal = () => {
    setSelectedJournalId(null);
    setJournalMode('blank');
    setIsModalVisible(true);
  };

  const openPromptJournal = () => {
    if (!isModalVisible) {
      setSelectedJournalId(null);
      setJournalMode('prompt');
      setModalStep('picker');
      setIsModalVisible(true);
      loadPrompts();
    }
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setSelectedPrompt(null);
    setSelectedJournalId(null);
    setModalStep('picker');
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText style={styles.headerText}>Journals</ThemedText>
      </ThemedView>
      <Divider />
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <ThemedText style={styles.subHeader}>Start a New Journal</ThemedText>
        <ThemedView style={styles.journalOptions}>
          <TouchableOpacity
            style={[styles.typeButton, styles.unguided]}
            onPress={openBlankJournal}
          >
            <ThemedText style={styles.typeText}>Blank Page</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeButton, styles.guided]}
            onPress={openPromptJournal}
          >
            <ThemedText style={styles.typeText}>Write with Prompts</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {journalsError && (
          <ErrorState
            compact
            testID="journals-error"
            error={journalsError}
            onRetry={() => user?.token && fetchJournals(user.token)}
            retrying={journalsLoading}
          />
        )}
        {journals.length === 0 && journalsLoading && <ActivityIndicator color="#74B7E2" testID="journals-loading" />}
        {journals.length === 0 && !journalsLoading && !journalsError && (
          <ThemedText style={styles.emptyText}>No entries yet. Start one above!</ThemedText>
        )}

        {[...journals]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .map((entry) => (
            <View key={entry.id} >
              <TouchableOpacity
                style={styles.card}
                onPress={() => {
                  setSelectedJournalId(entry.id);
                  setJournalMode('blank');
                  setIsModalVisible(true);
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <ThemedText style={styles.cardTitle}>{entry.title}</ThemedText>
                  <TouchableOpacity
                    style={styles.optionsButton}
                    onPress={() => setOptionsVisible(optionsVisible === entry.id ? null : entry.id)}
                  >
                    <MaterialIcons name="more-vert" size={24} color="black" />
                  </TouchableOpacity>
                </View>
                <ThemedText style={styles.dateText}>
                  {new Date(entry.createdAt).toLocaleString()}
                </ThemedText>
                <ThemedText style={styles.cardContent} numberOfLines={3} ellipsizeMode="tail">
                  {entry.content}
                </ThemedText>
              </TouchableOpacity>
              {optionsVisible === entry.id && (
                <View style={styles.optionsMenu}>
                  <TouchableOpacity
                    onPress={() => handleDeleteJournal(entry.id)}
                    style={styles.optionItem}
                  >
                    <ThemedText style={styles.optionText}>Delete</ThemedText>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
      </ScrollView>
      <BottomNav />

      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {journalMode === 'prompt' ? (
              modalStep === 'picker' ? (
                <>
                  <View style={styles.modalHeader}>
                    <ThemedText style={styles.promptHeader}>Choose a Prompt</ThemedText>
                    <TouchableOpacity onPress={closeModal}>
                      <ThemedText style={styles.closeText}>Close</ThemedText>
                    </TouchableOpacity>
                  </View>
                  {loadingPrompts ? (
                    <ThemedText style={{ textAlign: 'center', marginTop: 10 }}>Loading prompts...</ThemedText>
                  ) : promptsError ? (
                    <>
                      <ErrorState testID="prompts-error" error={promptsError} onRetry={loadPrompts} />
                      <TouchableOpacity onPress={() => setModalStep('entry')}>
                        <ThemedText style={styles.skipText}>Write without a prompt instead</ThemedText>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <ScrollView style={{ marginTop: 10 }}>
                      {promptOptions.map((prompt, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.promptCard}
                          onPress={() => {
                            setSelectedPrompt(prompt);
                            setModalStep('entry');
                          }}
                        >
                          <ThemedText style={styles.promptText}>{prompt}</ThemedText>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}

                </>
              ) : (
                <JournalEntryScreen
                  onClose={closeModal}
                  journalId={selectedJournalId ?? null}
                  initialContent={selectedPrompt || ''}
                />
              )
            ) : (
              <JournalEntryScreen onClose={closeModal} journalId={selectedJournalId ?? null} />
            )}
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FC' },
  scrollViewContent: {
    padding: '3%',
    paddingBottom: 100,
    minHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: '15%',
    backgroundColor: '#F7F9FC',

  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#DADADA',
  },
  headerText: {
    fontSize: 24,
    fontWeight: '600',
    fontFamily: 'Comfortaa_700Bold',
  },
  closeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E44AD',
    fontFamily: 'Comfortaa_700Bold',
  },
  subHeader: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Comfortaa_700Bold',
    textAlign: 'center',
  },
  journalOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    backgroundColor: '#F7F9FC',
    marginBottom: '5%',
  },
  typeButton: {
    flex: 1,
    paddingVertical: 20,
    marginHorizontal: '10%',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  unguided: { backgroundColor: '#D6ECF3' },
  guided: { backgroundColor: '#DFF4E3' },
  typeText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Comfortaa_700Bold',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },

  modalContainer: {
    width: '100%',
    height: '90%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
  },
  card: {
    backgroundColor: '#E4EAF2',
    borderRadius: 16,
    padding: '3%',
    margin: '2%',
    borderColor: '#878787',
    borderWidth: 1,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Comfortaa_700Bold',
  },
  cardContent: {
    fontSize: 16,
    fontFamily: 'Comfortaa_400Regular',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Comfortaa_400Regular',
  },
  optionsButton: { marginRight: 10 },
  emptyText: {
    textAlign: 'center',
    fontFamily: 'Comfortaa_400Regular',
    fontSize: 16,
    marginVertical: 20,
  },
  skipText: {
    textAlign: 'center',
    fontFamily: 'Comfortaa_700Bold',
    color: '#8E44AD',
    marginTop: 4,
  },
  optionsMenu: {
    position: 'absolute',
    top: 40,
    right: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    elevation: 5,
    width: 100,
  },
  optionItem: {
    padding: 10,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Comfortaa_400Regular',
    color: '#333',
  },
  promptHeader: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Comfortaa_400Regular',
    marginBottom: 10,
    textAlign: 'center',
  },
  promptCard: {
    backgroundColor: '#DCEBFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  promptText: {
    fontSize: 16,
    fontFamily: 'Comfortaa_400Regular',
  },
});
