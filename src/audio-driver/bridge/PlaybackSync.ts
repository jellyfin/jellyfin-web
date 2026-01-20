import { usePlayerStore, useMediaStore, useUiStore } from '../../store';
import { playbackManager } from '../../components/playback/playbackmanager';
import { logger } from '../../utils/logger';

/**
 * PlaybackSync Bridge
 * 
 * Handles secondary playback behaviors like transferring playback between players
 * and managing device orientation.
 */
export class PlaybackSync {
    private static instance: PlaybackSync;
    private orientationLocked = false;

    private constructor() {}

    static getInstance(): PlaybackSync {
        if (!PlaybackSync.instance) {
            PlaybackSync.instance = new PlaybackSync();
        }
        return PlaybackSync.instance;
    }

    start() {
        this.setupPlayerTransfer();
        this.setupOrientationManagement();
    }

    private setupPlayerTransfer() {
        // Migration of remotecontrolautoplay.js logic
        usePlayerStore.subscribe(
            (state) => state.playerChanged,
            (change) => {
                if (!change) return;
                const { from: oldPlayer, to: newPlayer } = change;

                if (!oldPlayer || !newPlayer) return;

                // Only transfer if moving from local to remote
                if (oldPlayer.isLocalPlayer && !newPlayer.isLocalPlayer) {
                    this.transferPlayback(oldPlayer, newPlayer);
                }
            }
        );
    }

    private async transferPlayback(oldPlayer: any, newPlayer: any) {
        logger.info('Transferring playback to remote player', { component: 'PlaybackSync' });
        
        // Use playbackManager's existing methods for now as they are already typed
        const state = playbackManager.getPlayerState(oldPlayer);
        const item = state.NowPlayingItem;

        if (!item) return;

        try {
            const playlist = await (playbackManager as any).getPlaylist(oldPlayer);
            const playlistIds = playlist.map((x: any) => x.Id);
            const playState = state.PlayState || {};
            const resumePositionTicks = playState.PositionTicks || 0;
            const playlistIndex = playlistIds.indexOf(item.Id) || 0;

            await playbackManager.stop(oldPlayer);
            await playbackManager.play({
                ids: playlistIds,
                serverId: item.ServerId,
                startPositionTicks: resumePositionTicks,
                startIndex: playlistIndex
            }, newPlayer);
        } catch (err) {
            logger.error('Failed to transfer playback', { component: 'PlaybackSync' }, err as Error);
        }
    }

    private setupOrientationManagement() {
        // Migration of playbackorientation.js logic
        useMediaStore.subscribe(
            (state) => state.status,
            (status) => {
                const { effectiveLayout } = useUiStore.getState();
                const { currentPlayer } = usePlayerStore.getState();
                
                if (status === 'playing' && effectiveLayout === 'mobile' && currentPlayer?.isLocalPlayer) {
                    this.lockOrientation();
                } else if (status === 'idle') {
                    this.unlockOrientation();
                }
            }
        );
    }

    private lockOrientation() {
        const screenAny = window.screen as any;
        const lockOrientation = screenAny.lockOrientation || 
                               screenAny.mozLockOrientation || 
                               screenAny.msLockOrientation || 
                               (screenAny.orientation?.lock?.bind(screenAny.orientation));

        if (lockOrientation) {
            try {
                const promise = lockOrientation('landscape');
                if (promise instanceof Promise) {
                    promise.then(() => {
                        this.orientationLocked = true;
                    }).catch(err => {
                        logger.error('Error locking orientation', { component: 'PlaybackSync' }, err);
                    });
                } else {
                    this.orientationLocked = !!promise;
                }
            } catch (err) {
                logger.error('Exception locking orientation', { component: 'PlaybackSync' }, err as Error);
            }
        }
    }

    private unlockOrientation() {
        if (!this.orientationLocked) return;

        const screenAny = window.screen as any;
        const unlockOrientation = screenAny.unlockOrientation || 
                                 screenAny.mozUnlockOrientation || 
                                 screenAny.msUnlockOrientation || 
                                 (screenAny.orientation?.unlock?.bind(screenAny.orientation));

        if (unlockOrientation) {
            try {
                unlockOrientation();
                this.orientationLocked = false;
            } catch (err) {
                logger.error('Error unlocking orientation', { component: 'PlaybackSync' }, err as Error);
            }
        }
    }
}

export const playbackSync = PlaybackSync.getInstance();
