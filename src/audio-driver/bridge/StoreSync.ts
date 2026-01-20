/**
 * StoreSync Bridge
 * 
 * Synchronizes Zustand store actions with the AudioDriver execution layer.
 * This is the "Control Layer" that connects the reactive UI to the imperative player.
 */

import { audioDriver } from '../AudioDriver';
import { useMediaStore, useQueueStore, useSettingsStore } from '../../store';
import { logger } from '../../utils/logger';

export class StoreSync {
    private static instance: StoreSync;
    private isSyncing = false;

    private constructor() {}

    static getInstance(): StoreSync {
        if (!StoreSync.instance) {
            StoreSync.instance = new StoreSync();
        }
        return StoreSync.instance;
    }

    start() {
        if (this.isSyncing) return;
        this.isSyncing = true;

        logger.info('StoreSync bridge started', { component: 'StoreSync' });

        // 1. Sync Playback Actions
        useMediaStore.subscribe(
            (state) => state.status,
            (status, prevStatus) => {
                if (status === prevStatus) return;

                if (status === 'playing') {
                    audioDriver.play();
                } else if (status === 'paused') {
                    audioDriver.pause();
                } else if (status === 'idle' && prevStatus !== 'idle') {
                    audioDriver.stop();
                }
            }
        );

        // 2. Sync Seek Actions
        // We use a manual trigger for seek to avoid event loops from timeupdate
        // This is handled by usePlaybackActions in hooks.ts calling mediaStore.seek()
        
        // 3. Sync Item Changes (The "Next Track" trigger)
        useMediaStore.subscribe(
            (state) => state.currentItem?.id,
            (id, prevId) => {
                if (!id || id === prevId) return;
                
                const item = useMediaStore.getState().currentItem;
                const streamInfo = useMediaStore.getState().streamInfo;
                
                if (item && streamInfo?.url) {
                    logger.debug('StoreSync: Loading new item', { component: 'StoreSync', itemId: id });
                    audioDriver.loadAndPlay(streamInfo.url, item);
                }
            }
        );

        // 4. Volume Sync (already partly in AudioDriver, but unified here if needed)
    }
}

export const storeSync = StoreSync.getInstance();
