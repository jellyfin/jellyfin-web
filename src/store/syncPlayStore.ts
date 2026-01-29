/**
 * SyncPlay Store
 *
 * Manages group playback synchronization state.
 * Coordinates multiple clients playing the same content.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { logger } from '../utils/logger';

export interface SyncPlayGroupInfo {
    groupId: string;
    groupName: string;
    participants: string[];
    lastUpdatedAt: number;
}

export interface SyncPlayState {
    isEnabled: boolean;
    isReady: boolean;
    followingGroupPlayback: boolean;
    groupInfo: SyncPlayGroupInfo | null;
    syncMethod: 'None' | 'Wait' | 'Seek' | 'Mixed';
    lastCommand: any | null;
    groupState: 'Idle' | 'Waiting' | 'Playing' | null;
}

export interface SyncPlayActions {
    setEnabled: (enabled: boolean, groupInfo?: SyncPlayGroupInfo) => void;
    setReady: (ready: boolean) => void;
    setFollowing: (following: boolean) => void;
    setGroupInfo: (info: SyncPlayGroupInfo | null) => void;
    setSyncMethod: (method: SyncPlayState['syncMethod']) => void;
    setGroupState: (state: SyncPlayState['groupState']) => void;
    processCommand: (cmd: any) => void;
    reset: () => void;
}

export const useSyncPlayStore = create<SyncPlayState & SyncPlayActions>()(
    subscribeWithSelector((set) => ({
        isEnabled: false,
        isReady: false,
        followingGroupPlayback: true,
        groupInfo: null,
        syncMethod: 'None',
        lastCommand: null,
        groupState: null,

        setEnabled: (enabled, groupInfo) => {
            set({
                isEnabled: enabled,
                groupInfo: groupInfo || null,
                isReady: false // Reset ready state when toggling
            });
            logger.info(`SyncPlay ${enabled ? 'enabled' : 'disabled'}`, {
                component: 'SyncPlayStore'
            });
        },

        setReady: (isReady) => set({ isReady }),

        setFollowing: (followingGroupPlayback) => set({ followingGroupPlayback }),

        setGroupInfo: (groupInfo) => set({ groupInfo }),

        setSyncMethod: (syncMethod) => set({ syncMethod }),

        setGroupState: (groupState) => set({ groupState }),

        processCommand: (lastCommand) => set({ lastCommand }),

        reset: () =>
            set({
                isEnabled: false,
                isReady: false,
                followingGroupPlayback: true,
                groupInfo: null,
                syncMethod: 'None',
                lastCommand: null,
                groupState: null
            })
    }))
);
