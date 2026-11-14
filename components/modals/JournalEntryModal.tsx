import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
} from 'react-native';
import { useJournals } from '@/context/JournalsContext';
import { useUser } from '@/context/UserContext';
import { createJournal, updateJournalEntry } from '@/scripts/services/journalService';
import { fetchOpenAIResponse } from '@/scripts/services/openaiService';
import { ThemedText } from '@/components/ThemedText';
import ButtonCTA from '@/components/ui/ButtonCTA';
import Divider from '@/components/ui/Divider';
import Markdown from 'react-native-markdown-display';
import ErrorState from '@/components/ui/ErrorState';
import { ApiError, toApiError } from '@/scripts/services/apiClient';

interface JournalEntryScreenProps {
  onClose: () => void;
  journalId: string | null;
  initialContent?: string;
}

export default function JournalEntryScreen({ onClose, journalId, initialContent }: JournalEntryScreenProps) {
  const [journalTitle, setJournalTitle] = useState('');
  const [journalContent, setJournalContent] = useState('');
  const [aiFeedback, setAiFeedback] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<ApiError | null>(null);
  const [feedbackError, setFeedbackError] = useState<ApiError | null>(null);
  const [isEditing, setIsEditing] = useState(journalId ? false : true);
  const { user } = useUser();
  const { journals, fetchJournals } = useJournals();

  useEffect(() => {
    if (journalId) {
      const existingJournal = journals.find((j) => j.id === journalId);
      if (existingJournal) {
        setJournalTitle(existingJournal.title);
        setJournalContent(existingJournal.content);
        if (existingJournal.llmResponse) {
          setAiFeedback(existingJournal.llmResponse);
        }
      }
    } else if (initialContent) {
      setJournalContent(initialContent);
    }
  }, [journalId, journals, initialContent]);

  const handleSave = async () => {
    const trimmedTitle = journalTitle.trim();
    const trimmedContent = journalContent.trim();
    const trimmedPrompt = initialContent?.trim() ?? '';
    const isEmpty = trimmedTitle === '' && trimmedContent === '';
    const isJustPrompt = trimmedContent === trimmedPrompt;

    if (isEmpty || isJustPrompt || !user?.id) {
      onClose();
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      if (journalId) {
        await updateJournalEntry(journalId, journalTitle, journalContent, user.token, aiFeedback);
      } else {
        await createJournal(journalTitle, journalContent, user.token, aiFeedback);
      }
      fetchJournals(user.token);
      onClose();
    } catch (error) {
      // Stay open so the entry isn't lost. Previously the modal closed and the text was gone.
      setSaveError(toApiError(error));
    } finally {
      setSaving(false);
    }
  };

  const getAiFeedback = async () => {
    if (!journalContent.trim()) {
      Alert.alert('Nothing to review yet', 'Write something before requesting AI feedback!');
      return;
    }
    if (!user) return;

    setLoading(true);
    setFeedbackError(null);

    const response = await fetchOpenAIResponse(journalId ?? '', journalContent, user.token);
    setLoading(false);

    if (response.error) {
      // Kept separate from aiFeedback: the error text used to be saved into the journal *as* feedback.
      setFeedbackError(new ApiError(response.offline ? 'network' : 'unknown', response.error));
      return;
    }
    setAiFeedback(response.response || 'No feedback available.');
    setShowFeedbackModal(true);
  };

  const markdownStyles = {
    text: {
      fontFamily: 'Comfortaa_400Regular',
      fontSize: 20,
    },
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.contentContainer}>
          <View style={styles.header}>
            <ThemedText style={styles.date}>{new Date().toDateString()}</ThemedText>
            {journalId && (
              <TouchableOpacity onPress={() => setIsEditing(prev => !prev)}>
                <ThemedText style={styles.linkText}>
                  {isEditing ? 'Stop Editing' : 'Edit'}
                </ThemedText>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleSave} disabled={saving} accessibilityRole="button">
              <ThemedText style={styles.completeText}>{saving ? 'Saving…' : 'Done'}</ThemedText>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.textFieldTitle}
            placeholder="Title"
            value={journalTitle}
            editable={isEditing}
            onChangeText={setJournalTitle}
          />

          <Divider />

          <TextInput
            style={styles.textFieldContent}
            multiline
            placeholder="Write your journal entry..."
            value={journalContent}
            editable={isEditing}
            onChangeText={setJournalContent}
            textAlignVertical="top"
            scrollEnabled
          />

          {loading && <ActivityIndicator size="large" color="#007AFF" style={styles.loading} />}
        </View>

        {saveError && (
          <ErrorState compact testID="save-error" error={saveError} onRetry={handleSave} retrying={saving} />
        )}
        {feedbackError && (
          <ErrorState compact testID="feedback-error" error={feedbackError} onRetry={getAiFeedback} retrying={loading} />
        )}

        <View style={styles.footer}>
          <ButtonCTA
            title={aiFeedback.trim() === '' ? 'Get Feedback' : 'View Feedback'}
            onPress={aiFeedback.trim() === '' ? getAiFeedback : () => setShowFeedbackModal(true)}
            disabled={loading}
          />
        </View>

        <Modal
          animationType="slide"
          transparent={false}
          visible={showFeedbackModal}
          onRequestClose={() => setShowFeedbackModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <ThemedText style={styles.feedbackTitle}>AI Feedback</ThemedText>
                <TouchableOpacity onPress={() => setShowFeedbackModal(false)}>
                  <ThemedText style={styles.closeText}>Close</ThemedText>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalScroll} nestedScrollEnabled>
                <Markdown style={markdownStyles}>{aiFeedback}</Markdown>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#DADADA',
  },
  date: {
    fontSize: 16,
    color: '#888',
    fontFamily: 'Comfortaa_400Regular',
  },
  completeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  linkText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E44AD',
    fontFamily: 'Comfortaa_700Bold',
  },
  textFieldTitle: {
    paddingVertical: 10,
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Comfortaa_700Bold',
  },
  textFieldContent: {
    fontSize: 16,
    fontFamily: 'Comfortaa_400Regular',
    paddingVertical: 10,
    minHeight: 150,
    maxHeight: '70%',
    color: '#000',
    textAlignVertical: 'top',
    marginTop: '5%',
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  loading: {
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    width: '100%',
    height: '88%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#DADADA',
    paddingBottom: 10,
  },
  modalScroll: {
    flex: 1,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Comfortaa_700Bold',
  },
  closeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    fontFamily: 'Comfortaa_700Bold',
  },
});