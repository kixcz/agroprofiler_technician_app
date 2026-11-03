/**
 * Persistent Local Storage Utility for Offline Data
 * Powered by expo-sqlite (kv_store + relational tables) with fallback for web
 */

import {
  getDatabase,
  getAllFarmers,
  getAllActivityLogs,
  getSyncQueueItems,
} from '../db/database';

// In-memory fallback for web only
const memoryStorage = new Map<string, string>();

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

export async function saveData(key: string, data: any): Promise<void> {
  try {
    const jsonData = JSON.stringify(data);
    memoryStorage.set(key, jsonData);
    const db = await getDatabase();
    if (db) {
      await db.runAsync(
        'INSERT OR REPLACE INTO kv_store (key, value, updated_at) VALUES (?, ?, ?)',
        [key, jsonData, new Date().toISOString()]
      );
    }
  } catch (error) {
    console.error('Error saving data to SQLite kv_store:', error);
  }
}

export async function getData(key: string): Promise<any | null> {
  try {
    const db = await getDatabase();
    if (db) {
      const row = await db.getFirstAsync<{ value: string }>(
        'SELECT value FROM kv_store WHERE key = ?',
        [key]
      );
      if (row?.value) {
        return JSON.parse(row.value);
      }
    }
    const jsonData = memoryStorage.get(key) || null;
    return jsonData ? JSON.parse(jsonData) : null;
  } catch (error) {
    console.error('Error getting data from SQLite kv_store:', error);
    return null;
  }
}

export async function removeData(key: string): Promise<void> {
  try {
    memoryStorage.delete(key);
    const db = await getDatabase();
    if (db) {
      await db.runAsync('DELETE FROM kv_store WHERE key = ?', [key]);
    }
  } catch (error) {
    console.error('Error removing data from SQLite kv_store:', error);
  }
}

export async function clearAllData(): Promise<void> {
  try {
    memoryStorage.clear();
    const db = await getDatabase();
    if (db) {
      await db.runAsync('DELETE FROM kv_store');
    }
  } catch (error) {
    console.error('Error clearing data:', error);
  }
}

// Farmer-specific operations
export async function saveFarmers(farmers: any[]): Promise<void> {
  await saveData(KEYS.FARMERS, farmers);
}

export async function getFarmers(): Promise<any[]> {
  const sqliteFarmers = await getAllFarmers();
  if (sqliteFarmers.length > 0) return sqliteFarmers;
  return (await getData(KEYS.FARMERS)) || [];
}

export async function addFarmer(farmer: any): Promise<void> {
  const farmers = await getFarmers();
  farmers.unshift(farmer);
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
  const sqliteLogs = await getAllActivityLogs();
  if (sqliteLogs.length > 0) return sqliteLogs;
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
  const queue = await getSyncQueueItems();
  return queue.filter((q) => q.status !== 'synced');
}

export async function markAsSynced(itemId: string): Promise<void> {
  const db = await getDatabase();
  if (db) {
    await db.runAsync(
      "UPDATE sync_queue SET status = 'synced', synced_at = ? WHERE operation_id = ?",
      [new Date().toISOString(), itemId]
    );
  }
}

export async function clearSyncedItems(): Promise<void> {
  const db = await getDatabase();
  if (db) {
    await db.runAsync("DELETE FROM sync_queue WHERE status = 'synced'");
  }
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
  const sqlQueue = await getSyncQueueItems();
  if (sqlQueue.length > 0) return sqlQueue;
  return (await getData(KEYS.OFFLINE_QUEUE)) || [];
}

export async function removeFromQueue(index: number): Promise<void> {
  const queue = (await getData(KEYS.OFFLINE_QUEUE)) || [];
  queue.splice(index, 1);
  await saveData(KEYS.OFFLINE_QUEUE, queue);
}

export async function clearOfflineQueue(): Promise<void> {
  await saveData(KEYS.OFFLINE_QUEUE, []);
}
