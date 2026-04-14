/**
 * Network Status Hook
 * Monitors online/offline status for offline-first functionality
 */

import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

interface NetworkState {
  isOnline: boolean;
  networkType: string | null;
  isConnectionExpensive: boolean;
}

export function useNetworkStatus() {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isOnline: true,
    networkType: null,
    isConnectionExpensive: false,
  });

  useEffect(() => {
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      setNetworkState({
        isOnline: state.isConnected ?? true,
        networkType: state.type,
        isConnectionExpensive: state.isConnectionExpensive ?? false,
      });
    });

    // Initial state check
    NetInfo.fetch().then((state) => {
      setNetworkState({
        isOnline: state.isConnected ?? true,
        networkType: state.type,
        isConnectionExpensive: state.isConnectionExpensive ?? false,
      });
    });

    return () => unsubscribe();
  }, []);

  return networkState;
}
