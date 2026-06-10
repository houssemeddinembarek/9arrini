"use client";

import { create } from "zustand";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  isRead: boolean;
  createdAt: string;
}

interface ServerNotification {
  _id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  isRead: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (items: ServerNotification[]) => void;
  addNotification: (n: Omit<Notification, "id" | "isRead" | "createdAt">) => void;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (items) =>
    set({
      notifications: items.map((i) => ({
        id: i._id,
        title: i.title,
        message: i.message,
        type: i.type,
        isRead: i.isRead,
        createdAt: i.createdAt,
      })),
      unreadCount: items.filter((i) => !i.isRead).length,
    }),
  addNotification: (n) =>
    set((state) => {
      const notification: Notification = {
        ...n,
        id: crypto.randomUUID(),
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      return {
        notifications: [notification, ...state.notifications].slice(0, 50),
        unreadCount: state.unreadCount + 1,
      };
    }),
  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),
  clearAll: () => set({ notifications: [], unreadCount: 0 }),
}));
