import { useNetInfo } from '@react-native-community/netinfo'

/** Whether the phone has a network connection (unknown counts as online, so nothing flashes at launch). */
export function useOnline(): boolean {
  return useNetInfo().isConnected !== false
}
