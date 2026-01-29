/**
 * Notification Store - Server Notifications and Events
 *
 * Manages real-time notifications from the Jellyfin server (WebSocket).
 * Replaces legacy Events logic for 'UserDataChanged', 'TimerCreated', etc.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { logger } from '../utils/logger';

export interface UserDataUpdate {
    itemId: string;
    isFavorite: boolean;
    played: boolean;
    playCount: number;
    playbackPositionTicks: number;
}

export interface ServerNotification {
    type: string;
    data: any;
    serverId: string;
    timestamp: number;
}

export interface NotificationState {
    lastUserDataUpdate: UserDataUpdate | null;
    notifications: ServerNotification[];
}

export interface NotificationActions {
    processUserDataChanged: (serverId: string, data: any) => void;
    addNotification: (serverId: string, type: string, data: any) => void;
    clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState & NotificationActions>()(
    subscribeWithSelector((set) => ({
        lastUserDataUpdate: null,
        notifications: [],

        processUserDataChanged: (serverId, data) => {
            const update: UserDataUpdate = {
                itemId: data.ItemId,
                isFavorite: data.IsFavorite,
                played: data.Played,
                playCount: data.PlayCount,
                playbackPositionTicks: data.PlaybackPositionTicks
            };

            set({ lastUserDataUpdate: update });

            // Still add to general notifications log
            set((state) => ({
                notifications: [
                    {
                        type: 'UserDataChanged',
                        data: update,
                        serverId,
                        timestamp: Date.now()
                    },
                    ...state.notifications
                ].slice(0, 50)
            }));

            logger.debug('User data changed', {
                component: 'NotificationStore',
                itemId: update.itemId
            });
        },

        addNotification: (serverId, type, data) => {
            set((state) => ({
                notifications: [
                    {
                        type,
                        data,
                        serverId,
                        timestamp: Date.now()
                    },
                    ...state.notifications
                ].slice(0, 50)
            }));

            logger.debug(`Server notification: ${type}`, { component: 'NotificationStore' });
        },

        clearNotifications: () => {
            set({ notifications: [], lastUserDataUpdate: null });
        }
    }))
);
