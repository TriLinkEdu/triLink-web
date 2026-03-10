import { create } from "zustand";
import { persist } from "zustand/middleware";

interface NotificationStore {
    readIds: string[];
    total: number;
    markRead: (id: string) => void;
    markAllRead: (ids: string[]) => void;
    setTotal: (n: number) => void;
}

export const useNotificationStore = create<NotificationStore>()(
    persist(
        (set) => ({
            readIds: [],
            total: 0,
            markRead: (id) =>
                set((s) => ({ readIds: [...new Set([...s.readIds, id])] })),
            markAllRead: (ids) =>
                set((s) => ({ readIds: [...new Set([...s.readIds, ...ids])] })),
            setTotal: (n) => set({ total: n }),
        }),
        { name: "trilink-notif-v1" }
    )
);
