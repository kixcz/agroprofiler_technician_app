/**
 * Local Storage Utility for Offline Data
 * Uses in-memory storage as fallback for Expo managed apps
 * TODO: Migrate to expo-sqlite for production
 */

// In-memory storage fallback
const memoryStorage = new Map<string, string>();

// Storage Keys
const KEYS = {
  FARMERS: '@agro_farmers',
  FARMS: '@agro_farms',
  ACTIVITIES: '@agro_activities',
  DAMAGE_REPORTS: '@agro_damage_reports',
  DISTRIBUTIONS: '@agro_distributions',
  PENDING_SYNC: '@agro_pending_sync',
  LAST_SYNC: '@agro_last_sync',
  OFFLINE_QUEUE: '@agro_offline_queue',
};

/**
 * Save data to local storage
 */
export async function saveData(key: string, data: any): Promise<void> {
  try {
    const jsonData = JSON.stringify(data);
    memoryStorage.set(key, jsonData);
  } catch (error) {
    console.error('Error saving data:', error);
    throw error;
  }
}

/**
 * Get data from local storage
 */
export async function getData(key: string): Promise<any | null> {
  try {
    const jsonData = memoryStorage.get(key) || null;
    return jsonData ? JSON.parse(jsonData) : null;
  } catch (error) {
    console.error('Error getting data:', error);
    return null;
  }
}

/**
 * Remove data from local storage
 */
export async function removeData(key: string): Promise<void> {
  try {
    memoryStorage.delete(key);
  } catch (error) {
    console.error('Error removing data:', error);
    throw error;
  }
}

/**
 * Clear all local storage
 */
export async function clearAllData(): Promise<void> {
  try {
    const keys = Object.values(KEYS);
    for (const key of keys) {
      memoryStorage.delete(key);
    }
  } catch (error) {
    console.error('Error clearing data:', error);
    throw error;
  }
}

// Farmer-specific operations
export async function saveFarmers(farmers: any[]): Promise<void> {
  await saveData(KEYS.FARMERS, farmers);
}

export async function getFarmers(): Promise<any[]> {
  return (await getData(KEYS.FARMERS)) || [];
}

export async function addFarmer(farmer: any): Promise<void> {
  const farmers = await getFarmers();
  farmers.unshift(farmer); // Add to beginning
  await saveFarmers(farmers);
}

export async function updateFarmer(id: string, updates: any): Promise<void> {
  const farmers = await getFarmers();
  const index = farmers.findIndex((f: any) => f.id === id);
  if (index !== -1) {
    farmers[index] = { ...farmers[index], ...updates };
    await saveFarmers(farmers);
  }
}

export async function deleteFarmer(id: string): Promise<void> {
  const farmers = await getFarmers();
  const filtered = farmers.filter((f: any) => f.id !== id);
  await saveFarmers(filtered);
}

// Activity-specific operations
export async function saveActivities(activities: any[]): Promise<void> {
  await saveData(KEYS.ACTIVITIES, activities);
}

export async function getActivities(): Promise<any[]> {
  return (await getData(KEYS.ACTIVITIES)) || [];
}

export async function addActivity(activity: any): Promise<void> {
  const activities = await getActivities();
  activities.unshift(activity);
  await saveActivities(activities);
}

// Pending Sync Queue
export async function addToPendingSync(item: any): Promise<void> {
  const pending = (await getData(KEYS.PENDING_SYNC)) || [];
  pending.push({
    ...item,
    timestamp: new Date().toISOString(),
    synced: false,
  });
  await saveData(KEYS.PENDING_SYNC, pending);
}

export async function getPendingSync(): Promise<any[]> {
  return (await getData(KEYS.PENDING_SYNC)) || [];
}

export async function markAsSynced(itemId: string): Promise<void> {
  const pending = await getPendingSync();
  const updated = pending.map((item: any) =>
    item.id === itemId ? { ...item, synced: true } : item
  );
  await saveData(KEYS.PENDING_SYNC, updated);
}

export async function clearSyncedItems(): Promise<void> {
  const pending = await getPendingSync();
  const unsynced = pending.filter((item: any) => !item.synced);
  await saveData(KEYS.PENDING_SYNC, unsynced);
}

// Last Sync Timestamp
export async function updateLastSync(): Promise<void> {
  await saveData(KEYS.LAST_SYNC, new Date().toISOString());
}

export async function getLastSync(): Promise<string | null> {
  return await getData(KEYS.LAST_SYNC);
}

// Offline Queue for API calls
export async function addToOfflineQueue(operation: any): Promise<void> {
  const queue = (await getData(KEYS.OFFLINE_QUEUE)) || [];
  queue.push({
    ...operation,
    timestamp: new Date().toISOString(),
    retries: 0,
  });
  await saveData(KEYS.OFFLINE_QUEUE, queue);
}

export async function getOfflineQueue(): Promise<any[]> {
  return (await getData(KEYS.OFFLINE_QUEUE)) || [];
}

export async function removeFromQueue(index: number): Promise<void> {
  const queue = await getOfflineQueue();
  queue.splice(index, 1);
  await saveData(KEYS.OFFLINE_QUEUE, queue);
}

export async function clearOfflineQueue(): Promise<void> {
  await saveData(KEYS.OFFLINE_QUEUE, []);
}
