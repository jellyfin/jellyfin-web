/**
 * Module that manages the playback of SyncPlay.
 * @module components/syncPlay/core/PlaybackCore
 */

import Events from '../../../utils/events';
import { toBoolean, toFloat } from '../../../utils/string';
import * as Helper from './Helper';
import { getSetting } from './Settings';
import { logger } from '../../../utils/logger';
import { useSyncPlayStore } from '../../../store/syncPlayStore';

/**
 * Class that manages the playback of SyncPlay.
 */
class PlaybackCore {
    manager: any = null;
    timeSyncCore: any = null;
    syncEnabled: boolean = false;
    playbackDiffMillis: number = 0;
    syncAttempts: number = 0;
    lastSyncTime: Date = new Date();
    playerIsBuffering: boolean = false;
    lastCommand: any = null;
    scheduledCommandTimeout: any = null;
    syncTimeout: any = null;
    
    // Preferences
    minDelaySpeedToSync: number = 60;
    maxDelaySpeedToSync: number = 3000;
    speedToSyncDuration: number = 1000;
    minDelaySkipToSync: number = 400;
    useSpeedToSync: boolean = true;
    useSkipToSync: boolean = true;
    enableSyncCorrection: boolean = false;

    constructor() {
        this.loadPreferences();
    }

    /**
     * Initializes the core.
     * @param {Manager} syncPlayManager The SyncPlay manager.
     */
    init(syncPlayManager: any) {
        this.manager = syncPlayManager;
        this.timeSyncCore = syncPlayManager.getTimeSyncCore();

        Events.on(this.manager, 'settings-update', () => {
            this.loadPreferences();
        });
    }

    /**
     * Loads preferences from saved settings.
     */
    loadPreferences() {
        this.minDelaySpeedToSync = toFloat(getSetting('minDelaySpeedToSync'), 60.0);
        this.maxDelaySpeedToSync = toFloat(getSetting('maxDelaySpeedToSync'), 3000.0);
        this.speedToSyncDuration = toFloat(getSetting('speedToSyncDuration'), 1000.0);
        this.minDelaySkipToSync = toFloat(getSetting('minDelaySkipToSync'), 400.0);
        this.useSpeedToSync = toBoolean(getSetting('useSpeedToSync'), true);
        this.useSkipToSync = toBoolean(getSetting('useSkipToSync'), true);
        this.enableSyncCorrection = toBoolean(getSetting('enableSyncCorrection'), false);
    }

    onPlaybackStart(player: any, state: any) {
        Events.trigger(this.manager, 'playbackstart', [player, state]);
    }

    onPlaybackStop(stopInfo: any) {
        this.lastCommand = null;
        Events.trigger(this.manager, 'playbackstop', [stopInfo]);
    }

    onUnpause() {
        Events.trigger(this.manager, 'unpause');
    }

    onPause() {
        Events.trigger(this.manager, 'pause');
    }

    onTimeUpdate(event: any, timeUpdateData: any) {
        this.syncPlaybackTime(timeUpdateData);
        Events.trigger(this.manager, 'timeupdate', [event, timeUpdateData]);
    }

    onReady() {
        this.playerIsBuffering = false;
        this.sendBufferingRequest(false);
        Events.trigger(this.manager, 'ready');
    }

    onBuffering() {
        this.playerIsBuffering = true;
        this.sendBufferingRequest(true);
        Events.trigger(this.manager, 'buffering');
    }

    async sendBufferingRequest(isBuffering = true) {
        const playerWrapper = this.manager.getPlayerWrapper();
        if (!playerWrapper) return;

        const currentPosition = (playerWrapper.currentTimeAsync ?
            await playerWrapper.currentTimeAsync() :
            playerWrapper.currentTime());
        const currentPositionTicks = Math.round(currentPosition * (Helper as any).TicksPerMillisecond);
        const isPlaying = playerWrapper.isPlaying();

        const currentTime = new Date();
        const now = this.timeSyncCore.localDateToRemote(currentTime);
        const playlistItemId = this.manager.getQueueCore().getCurrentPlaylistItemId();

        const options = {
            When: now.toISOString(),
            PositionTicks: currentPositionTicks,
            IsPlaying: isPlaying,
            PlaylistItemId: playlistItemId
        };

        const apiClient = this.manager.getApiClient();
        if (isBuffering) {
            apiClient.requestSyncPlayBuffering(options);
        } else {
            apiClient.requestSyncPlayReady(options);
        }
    }

    isBuffering() {
        return this.playerIsBuffering;
    }

    async applyCommand(command: any) {
        // Check if duplicate.
        if (this.lastCommand
            && this.lastCommand.When.getTime() === command.When.getTime()
            && this.lastCommand.PositionTicks === command.PositionTicks
            && this.lastCommand.Command === command.Command
            && this.lastCommand.PlaylistItemId === command.PlaylistItemId
        ) {
            logger.debug('SyncPlay applyCommand: duplicate command received', { component: 'SyncPlay', command });

            const currentTime = new Date();
            const whenLocal = this.timeSyncCore.remoteDateToLocal(command.When);
            if (whenLocal > currentTime) {
                logger.debug('SyncPlay applyCommand: command already scheduled', { component: 'SyncPlay', command });
                return;
            } else {
                const playerWrapper = this.manager.getPlayerWrapper();
                const currentPositionTicks = Math.round((playerWrapper.currentTimeAsync ?
                    await playerWrapper.currentTimeAsync() :
                    playerWrapper.currentTime()) * (Helper as any).TicksPerMillisecond);
                const isPlaying = playerWrapper.isPlaying();

                switch (command.Command) {
                    case 'Unpause':
                        if (!isPlaying) {
                            this.scheduleUnpause(command.When, command.PositionTicks);
                        }
                        break;
                    case 'Pause':
                        if (isPlaying || currentPositionTicks !== command.PositionTicks) {
                            this.schedulePause(command.When, command.PositionTicks);
                        }
                        break;
                    case 'Stop':
                        if (isPlaying) {
                            this.scheduleStop(command.When);
                        }
                        break;
                    case 'Seek':
                        if (isPlaying || currentPositionTicks !== command.PositionTicks) {
                            const rangeWidth = 100; // In milliseconds.
                            // eslint-disable-next-line sonarjs/pseudo-random
                            const randomOffsetTicks = Math.round((Math.random() - 0.5) * rangeWidth) * (Helper as any).TicksPerMillisecond;
                            this.scheduleSeek(command.When, command.PositionTicks + randomOffsetTicks);
                            logger.debug('SyncPlay applyCommand: adding random offset to force seek', { component: 'SyncPlay', randomOffsetTicks, command });
                        } else {
                            this.sendBufferingRequest(false);
                        }
                        break;
                    default:
                        logger.error('SyncPlay applyCommand: command not recognised', { component: 'SyncPlay', command });
                        break;
                }
                return;
            }
        }

        this.lastCommand = command;

        if (this.manager.isRemote()) {
            return;
        }

        switch (command.Command) {
            case 'Unpause':
                this.scheduleUnpause(command.When, command.PositionTicks);
                break;
            case 'Pause':
                this.schedulePause(command.When, command.PositionTicks);
                break;
            case 'Stop':
                this.scheduleStop(command.When);
                break;
            case 'Seek':
                this.scheduleSeek(command.When, command.PositionTicks);
                break;
            default:
                logger.error('SyncPlay applyCommand: command not recognised', { component: 'SyncPlay', command });
                break;
        }
    }

    async scheduleUnpause(playAtTime: Date, positionTicks: number) {
        this.clearScheduledCommand();
        const enableSyncTimeout = this.maxDelaySpeedToSync / 2.0;
        const currentTime = new Date();
        const playAtTimeLocal = this.timeSyncCore.remoteDateToLocal(playAtTime);

        const playerWrapper = this.manager.getPlayerWrapper();
        const currentPositionTicks = (playerWrapper.currentTimeAsync ?
            await playerWrapper.currentTimeAsync() :
            playerWrapper.currentTime()) * (Helper as any).TicksPerMillisecond;

        if (playAtTimeLocal > currentTime) {
            const playTimeout = playAtTimeLocal.getTime() - currentTime.getTime();

            if ((currentPositionTicks - positionTicks) > this.minDelaySkipToSync * (Helper as any).TicksPerMillisecond) {
                this.localSeek(positionTicks);
            }

            this.scheduledCommandTimeout = setTimeout(() => {
                this.localUnpause();
                Events.trigger(this.manager, 'notify-osd', ['unpause']);

                this.syncTimeout = setTimeout(() => {
                    this.syncEnabled = true;
                }, enableSyncTimeout);
            }, playTimeout);

            logger.debug('SyncPlay scheduled unpause', { component: 'SyncPlay', timeoutSeconds: playTimeout / 1000.0 });
        } else {
            const serverPositionTicks = this.estimateCurrentTicks(positionTicks, playAtTime);
            (Helper as any).waitForEventOnce(this.manager, 'unpause').then(() => {
                this.localSeek(serverPositionTicks);
            });
            this.localUnpause();
            setTimeout(() => {
                Events.trigger(this.manager, 'notify-osd', ['unpause']);
            }, 100);

            this.syncTimeout = setTimeout(() => {
                this.syncEnabled = true;
            }, enableSyncTimeout);

            logger.debug('SyncPlay scheduleUnpause: unpause now', { component: 'SyncPlay', serverPositionTicks, currentPositionTicks });
        }
    }

    schedulePause(pauseAtTime: Date, positionTicks: number) {
        this.clearScheduledCommand();
        const currentTime = new Date();
        const pauseAtTimeLocal = this.timeSyncCore.remoteDateToLocal(pauseAtTime);

        const callback = () => {
            (Helper as any).waitForEventOnce(this.manager, 'pause', (Helper as any).WaitForPlayerEventTimeout).then(() => {
                this.localSeek(positionTicks);
            }).catch(() => {
                this.localSeek(positionTicks);
            });
            this.localPause();
        };

        if (pauseAtTimeLocal > currentTime) {
            const pauseTimeout = pauseAtTimeLocal.getTime() - currentTime.getTime();
            this.scheduledCommandTimeout = setTimeout(callback, pauseTimeout);

            logger.debug('SyncPlay scheduled pause', { component: 'SyncPlay', timeoutSeconds: pauseTimeout / 1000.0 });
        } else {
            callback();
            logger.debug('SyncPlay schedulePause: now', { component: 'SyncPlay' });
        }
    }

    scheduleStop(stopAtTime: Date) {
        this.clearScheduledCommand();
        const currentTime = new Date();
        const stopAtTimeLocal = this.timeSyncCore.remoteDateToLocal(stopAtTime);

        const callback = () => {
            this.localStop();
        };

        if (stopAtTimeLocal > currentTime) {
            const stopTimeout = stopAtTimeLocal.getTime() - currentTime.getTime();
            this.scheduledCommandTimeout = setTimeout(callback, stopTimeout);

            logger.debug('SyncPlay scheduled stop', { component: 'SyncPlay', timeoutSeconds: stopTimeout / 1000.0 });
        } else {
            callback();
            logger.debug('SyncPlay scheduleStop: now', { component: 'SyncPlay' });
        }
    }

    scheduleSeek(seekAtTime: Date, positionTicks: number) {
        this.clearScheduledCommand();
        const currentTime = new Date();
        const seekAtTimeLocal = this.timeSyncCore.remoteDateToLocal(seekAtTime);

        const callback = () => {
            this.localUnpause();
            this.localSeek(positionTicks);

            (Helper as any).waitForEventOnce(this.manager, 'ready', (Helper as any).WaitForEventDefaultTimeout).then(() => {
                this.localPause();
                this.sendBufferingRequest(false);
            }).catch((error: Error) => {
                logger.error("SyncPlay: timed out waiting for 'ready' event", { component: 'SyncPlay', positionTicks, error: error.message });
                this.localSeek(positionTicks);
            });
        };

        if (seekAtTimeLocal > currentTime) {
            const seekTimeout = seekAtTimeLocal.getTime() - currentTime.getTime();
            this.scheduledCommandTimeout = setTimeout(callback, seekTimeout);

            logger.debug('SyncPlay scheduled seek', { component: 'SyncPlay', timeoutSeconds: seekTimeout / 1000.0 });
        } else {
            callback();
            logger.debug('SyncPlay scheduleSeek: now', { component: 'SyncPlay' });
        }
    }

    clearScheduledCommand() {
        clearTimeout(this.scheduledCommandTimeout);
        clearTimeout(this.syncTimeout);

        this.syncEnabled = false;
        const playerWrapper = this.manager.getPlayerWrapper();
        if (playerWrapper && playerWrapper.hasPlaybackRate()) {
            playerWrapper.setPlaybackRate(1.0);
        }

        this.manager.clearSyncIcon();
    }

    localUnpause() {
        if (!this.manager.isPlaybackActive()) return;
        const playerWrapper = this.manager.getPlayerWrapper();
        return playerWrapper.localUnpause();
    }

    localPause() {
        if (!this.manager.isPlaybackActive()) return;
        const playerWrapper = this.manager.getPlayerWrapper();
        return playerWrapper.localPause();
    }

    localSeek(positionTicks: number) {
        if (!this.manager.isPlaybackActive()) return;
        const playerWrapper = this.manager.getPlayerWrapper();
        return playerWrapper.localSeek(positionTicks);
    }

    localStop() {
        if (!this.manager.isPlaybackActive()) return;
        const playerWrapper = this.manager.getPlayerWrapper();
        return playerWrapper.localStop();
    }

    estimateCurrentTicks(ticks: number, when: Date, currentTime = new Date()) {
        const remoteTime = this.timeSyncCore.localDateToRemote(currentTime);
        return ticks + (remoteTime.getTime() - when.getTime()) * (Helper as any).TicksPerMillisecond;
    }

    syncPlaybackTime(timeUpdateData: any) {
        const syncMethodThreshold = this.maxDelaySpeedToSync;
        let speedToSyncTime = this.speedToSyncDuration;

        if (!this.manager.isPlaybackActive()) return;

        const { lastCommand } = this;
        if (!lastCommand || lastCommand.Command !== 'Unpause' || this.isBuffering()) return;

        const queueCore = this.manager.getQueueCore();
        const currentPlaylistItem = queueCore.getCurrentPlaylistItemId();
        if (lastCommand.PlaylistItemId !== currentPlaylistItem) return;

        const { currentTime, currentPosition } = timeUpdateData;
        const currentPositionTicks = currentPosition * (Helper as any).TicksPerMillisecond;
        const serverPositionTicks = this.estimateCurrentTicks(lastCommand.PositionTicks, lastCommand.When, currentTime);
        const diffMillis = (serverPositionTicks - currentPositionTicks) / (Helper as any).TicksPerMillisecond;

        this.playbackDiffMillis = diffMillis;
        Events.trigger(this.manager, 'playback-diff', [this.playbackDiffMillis]);

        const elapsed = currentTime.getTime() - this.lastSyncTime.getTime();
        if (elapsed < syncMethodThreshold / 2) return;

        this.lastSyncTime = currentTime;
        const playerWrapper = this.manager.getPlayerWrapper();

        if (this.syncEnabled && this.enableSyncCorrection) {
            const absDiffMillis = Math.abs(diffMillis);
            if (playerWrapper.hasPlaybackRate() && this.useSpeedToSync && absDiffMillis >= this.minDelaySpeedToSync && absDiffMillis < this.maxDelaySpeedToSync) {
                const MinSpeed = 0.2;
                if (diffMillis <= -speedToSyncTime * MinSpeed) {
                    speedToSyncTime = Math.abs(diffMillis) / (1.0 - MinSpeed);
                }

                const speed = 1 + diffMillis / speedToSyncTime;
                playerWrapper.setPlaybackRate(speed);
                this.syncEnabled = false;
                this.syncAttempts++;
                this.manager.showSyncIcon(`Seek` as any); // Simplified type for now

                this.syncTimeout = setTimeout(() => {
                    playerWrapper.setPlaybackRate(1.0);
                    this.syncEnabled = true;
                    this.manager.clearSyncIcon();
                }, speedToSyncTime);
            } else if (this.useSkipToSync && absDiffMillis >= this.minDelaySkipToSync) {
                this.localSeek(serverPositionTicks);
                this.syncEnabled = false;
                this.syncAttempts++;
                this.manager.showSyncIcon(`Seek` as any);

                this.syncTimeout = setTimeout(() => {
                    this.syncEnabled = true;
                    this.manager.clearSyncIcon();
                }, syncMethodThreshold / 2);
            }
        }
    }
}

export { PlaybackCore };
export default PlaybackCore;