/**
 * Notification Service
 * Handles in-app notifications and alerts
 */

import { useState, useCallback } from 'react';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  timestamp: number;
  duration?: number;
  read: boolean;
}

// In-memory notification store
let notifications: Notification[] = [];
let listeners: Array<(notifications: Notification[]) => void> = [];

/**
 * Notify all listeners of changes
 */
function notifyListeners() {
  listeners.forEach((listener) => listener(notifications));
}

/**
 * Add a notification
 */
export function addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): string {
  const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const newNotification: Notification = {
    ...notification,
    id,
    timestamp: Date.now(),
    read: false,
    duration: notification.duration ?? 5000,
  };

  notifications = [newNotification, ...notifications];
  notifyListeners();

  // Auto-remove after duration
  if (newNotification.duration && newNotification.duration > 0) {
    setTimeout(() => {
      removeNotification(id);
    }, newNotification.duration);
  }

  return id;
}

/**
 * Remove a notification
 */
export function removeNotification(id: string): void {
  notifications = notifications.filter((n) => n.id !== id);
  notifyListeners();
}

/**
 * Mark notification as read
 */
export function markAsRead(id: string): void {
  notifications = notifications.map((n) =>
    n.id === id ? { ...n, read: true } : n
  );
  notifyListeners();
}

/**
 * Mark all notifications as read
 */
export function markAllAsRead(): void {
  notifications = notifications.map((n) => ({ ...n, read: true }));
  notifyListeners();
}

/**
 * Clear all notifications
 */
export function clearAllNotifications(): void {
  notifications = [];
  notifyListeners();
}

/**
 * Get all notifications
 */
export function getNotifications(): Notification[] {
  return notifications;
}

/**
 * Get unread count
 */
export function getUnreadCount(): number {
  return notifications.filter((n) => !n.read).length;
}

/**
 * Subscribe to notification changes
 */
export function subscribe(callback: (notifications: Notification[]) => void): () => void {
  listeners.push(callback);
  callback(notifications);

  return () => {
    listeners = listeners.filter((l) => l !== callback);
  };
}

// Convenience functions
export function notifySuccess(title: string, message?: string): string {
  return addNotification({
    type: 'success',
    title,
    message,
  });
}

export function notifyError(title: string, message?: string): string {
  return addNotification({
    type: 'error',
    title,
    message,
  });
}

export function notifyWarning(title: string, message?: string): string {
  return addNotification({
    type: 'warning',
    title,
    message,
  });
}

export function notifyInfo(title: string, message?: string): string {
  return addNotification({
    type: 'info',
    title,
    message,
  });
}

/**
 * Hook to use notifications in components
 */
export function useNotifications() {
  const [notificationList, setNotificationList] = useState<Notification[]>(notifications);

  const handleNotifications = useCallback((updated: Notification[]) => {
    setNotificationList(updated);
  }, []);

  useState(() => {
    const unsubscribe = subscribe(handleNotifications);
    return unsubscribe;
  });

  return {
    notifications: notificationList,
    unreadCount: notificationList.filter((n) => !n.read).length,
    add: addNotification,
    remove: removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll: clearAllNotifications,
  };
}
