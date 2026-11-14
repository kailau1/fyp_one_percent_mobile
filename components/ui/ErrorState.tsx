import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ApiError, toApiError } from '@/scripts/services/apiClient';

interface ErrorStateProps {
  /** The error to describe. Anything thrown is accepted and normalised. */
  error: ApiError | unknown;
  /** Shows a "Try again" button when provided. */
  onRetry?: () => void;
  /** Disables the button and shows a spinner while a retry is in flight. */
  retrying?: boolean;
  /** A slim banner (e.g. above cached data) instead of a padded card. */
  compact?: boolean;
  testID?: string;
}

/**
 * Consistent error UI: a "can't reach server" look when offline, a generic one otherwise,
 * always with a human-readable message and an optional retry.
 */
export default function ErrorState({ error, onRetry, retrying, compact, testID = 'error-state' }: ErrorStateProps) {
  const apiError = toApiError(error);
  const offline = apiError.isOffline;

  return (
    <View
      testID={testID}
      style={[styles.container, compact ? styles.compact : styles.card, offline ? styles.offline : styles.failure]}
    >
      <Feather name={offline ? 'wifi-off' : 'alert-circle'} size={compact ? 18 : 28} color="#7A4B00" />
      <View style={compact ? styles.compactBody : styles.cardBody}>
        {!compact && <Text style={styles.title}>{offline ? "You're offline" : 'Something went wrong'}</Text>}
        <Text
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          style={[styles.message, compact && styles.compactMessage]}
        >
          {apiError.message}
        </Text>
      </View>
      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          disabled={retrying}
          accessibilityRole="button"
          accessibilityLabel="Try again"
          style={[styles.button, retrying && styles.buttonDisabled]}
        >
          {retrying ? <ActivityIndicator size="small" color="#000" /> : <Text style={styles.buttonText}>Try again</Text>}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
  },
  card: {
    alignItems: 'center',
    padding: 20,
    margin: 20,
    gap: 10,
  },
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 20,
    marginVertical: 8,
    gap: 10,
  },
  offline: {
    backgroundColor: '#FFF4D6',
    borderColor: '#E8C66A',
  },
  failure: {
    backgroundColor: '#FDE7E9',
    borderColor: '#F1A7AF',
  },
  cardBody: {
    alignItems: 'center',
  },
  compactBody: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Comfortaa_700Bold',
    marginBottom: 4,
    color: '#333',
  },
  message: {
    fontSize: 15,
    fontFamily: 'Comfortaa_400Regular',
    textAlign: 'center',
    color: '#333',
  },
  compactMessage: {
    textAlign: 'left',
    fontSize: 13,
  },
  button: {
    backgroundColor: '#74B7E2',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    minWidth: 96,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontFamily: 'Comfortaa_700Bold',
    fontSize: 14,
    color: '#000',
  },
});
