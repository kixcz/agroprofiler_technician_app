/**
 * Offline Detection and Network Monitoring
 * Provides utilities for handling offline scenarios and network changes
 */

import { useEffect, useState } from 'react';
import * as Network from 'expo-network';
import { logger } from './logger';

export interface NetworkState {
  isOnline: boolean;
  isWifi: boolean;
  type: Network.NetworkStateType;
}

/**
 * Hook to monitor network status
 */
export function useNetworkStatus() {
  const [state, setState] = useState<NetworkState>({
    isOnline: true,
    isWifi: false,
    type: Network.NetworkStateType.UNKNOWN,
  });

  useEffect(() => {
    const subscription = Network.addNetworkStateListener((newNetworkState: Network.NetworkState) => {
      const isOnline = newNetworkState.isConnected ?? false;
      const isWifi = newNetworkState.type === Network.NetworkStateType.WIFI;

      setState({
        isOnline,
        isWifi,
        type: newNetworkState.type ?? Network.NetworkStateType.UNKNOWN,
      });

      if (!isOnline) {
        logger.warn('Device went offline');
      } else {
        logger.info('Device came online', {
          type: newNetworkState.type,
          isWifi,
        });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return state;
}

/**
 * Check network connectivity
 */
export async function checkNetworkConnectivity(): Promise<boolean> {
  try {
    const state = await Network.getNetworkStateAsync();
    return state.isConnected ?? false;
  } catch (error) {
    logger.error('Failed to check network connectivity', { error });
    return false;
  }
}

/**
 * Queue operations for when network is available
 */
class OfflineQueue {
  private queue: Array<() => Promise<void>> = [];
  private isProcessing = false;

  /**
   * Add operation to queue
   */
  public async enqueue(operation: () => Promise<void>): Promise<void> {
    this.queue.push(operation);

    if (await checkNetworkConnectivity()) {
      this.processQueue();
    }
  }

  /**
   * Process queued operations when network is available
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const operation = this.queue.shift();

      if (!operation) break;

      try {
        await operation();
      } catch (error) {
        logger.error('Failed to process queued operation', { error });
        // Add back to queue for retry
        this.queue.unshift(operation);
        break;
      }
    }

    this.isProcessing = false;
  }

  /**
   * Get queue size
   */
  public getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Clear queue
   */
  public clear(): void {
    this.queue = [];
  }
}

export const offlineQueue = new OfflineQueue();

/**
 * Hook to handle offline queue with network monitoring
 */
export function useOfflineQueue() {
  const networkStatus = useNetworkStatus();

  useEffect(() => {
    if (networkStatus.isOnline) {
      const processQueue = async () => {
        // Small delay to ensure connection is stable
        await new Promise((resolve) => setTimeout(resolve, 500));
        // Queue will process itself
      };

      processQueue();
    }
  }, [networkStatus.isOnline]);

  return offlineQueue;
}
