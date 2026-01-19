/**
 * Controls Store - Unified Control Layer
 *
 * Unified control layer that coordinates between local, remote, and server controls.
 * Priority: Local (1) > Remote (2) > Server (3)
 * Transfer confirmation: Remote→Local requires dialog, 20s timeout
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { PlayableItem, PlayerInfo } from './types';

export type ControlSource = 'local' | 'remote' | 'server';

export interface ControlState {
    // Active control source
    activeControlSource: ControlSource;

    // Remote control connection
    remoteConnected: boolean;
    remoteClientName: string | null;
    remoteLastActivity: number;

    // Server-based playback state
    serverPlaybackState: {
        isPlaying: boolean;
        positionTicks: number;
        canSeek: boolean;
    } | null;

    // Transfer state
    pendingTransfer: {
        fromSource: ControlSource;
        toSource: ControlSource;
        confirmRequired: boolean;
        timeout: number;
    } | null;

    // Control capabilities per source
    controlCapabilities: {
        local: {
            canPlay: boolean;
            canPause: boolean;
            canSeek: boolean;
            canChangeVolume: boolean;
        };
        remote: {
            canPlay: boolean;
            canPause: boolean;
            canSeek: boolean;
            canChangeVolume: boolean;
        };
        server: {
            canPlay: boolean;
            canPause: boolean;
            canSeek: boolean;
            canChangeVolume: boolean;
        };
    };

    // UI state
    showTransferDialog: boolean;
    transferCountdown: number | null;
}

export interface ControlActions {
    // Control source management
    setActiveControlSource: (source: ControlSource) => void;
    getActiveControlSource: () => ControlSource;

    // Remote control
    setRemoteConnected: (connected: boolean, clientName?: string) => void;
    updateRemoteActivity: () => void;
    isRemoteActive: () => boolean;

    // Server control
    setServerPlaybackState: (state: ControlState['serverPlaybackState']) => void;
    isServerPlaying: () => boolean;

    // Transfer management
    initiateTransfer: (fromSource: ControlSource, toSource: ControlSource) => void;
    confirmTransfer: () => void;
    cancelTransfer: () => void;
    acceptTransfer: () => void;
    declineTransfer: () => void;

    // Control execution (with priority)
    play: (item?: PlayableItem) => boolean;
    pause: () => boolean;
    stop: () => boolean;
    seek: (time: number) => boolean;
    setVolume: (volume: number) => boolean;
    toggleMute: () => boolean;
    nextTrack: () => boolean;
    prevTrack: () => boolean;
    togglePlayPause: () => boolean;

    // Capability queries
    canControl: (action: 'play' | 'pause' | 'stop' | 'seek' | 'volume' | 'next' | 'prev') => boolean;
    getControlSourceForAction: (action: string) => ControlSource;

    // UI actions
    setShowTransferDialog: (show: boolean) => void;
    setTransferCountdown: (countdown: number | null) => void;

    // State reset
    reset: () => void;
}

const CONTROL_PRIORITY: ControlSource[] = ['local', 'remote', 'server'];

const initialState: ControlState = {
    activeControlSource: 'local',
    remoteConnected: false,
    remoteClientName: null,
    remoteLastActivity: 0,
    serverPlaybackState: null,
    pendingTransfer: null,
    controlCapabilities: {
        local: {
            canPlay: true,
            canPause: true,
            canSeek: true,
            canChangeVolume: true
        },
        remote: {
            canPlay: true,
            canPause: true,
            canSeek: true,
            canChangeVolume: false
        },
        server: {
            canPlay: true,
            canPause: true,
            canSeek: true,
            canChangeVolume: false
        }
    },
    showTransferDialog: false,
    transferCountdown: null
};

export const useControlsStore = create<ControlState & ControlActions>()(
    subscribeWithSelector((set, get) => ({
        ...initialState,

        setActiveControlSource: (source) => {
            set({ activeControlSource: source });
        },

        getActiveControlSource: () => {
            return get().activeControlSource;
        },

        setRemoteConnected: (connected, clientName) => {
            set({
                remoteConnected: connected,
                remoteClientName: connected ? clientName ?? 'Remote Client' : null,
                remoteLastActivity: connected ? Date.now() : 0,
                activeControlSource: connected ? 'remote' : 'local'
            });
        },

        updateRemoteActivity: () => {
            set({
                remoteLastActivity: Date.now(),
                activeControlSource: 'remote'
            });
        },

        isRemoteActive: () => {
            const { remoteConnected, remoteLastActivity } = get();

            if (!remoteConnected) return false;

            const idleTimeout = 5 * 60 * 1000;
            return Date.now() - remoteLastActivity < idleTimeout;
        },

        setServerPlaybackState: (state) => {
            set({
                serverPlaybackState: state,
                activeControlSource: state ? 'server' : 'local'
            });
        },

        isServerPlaying: () => {
            return get().serverPlaybackState?.isPlaying ?? false;
        },

        startTransferCountdown: () => {
            const countdownInterval = setInterval(() => {
                const { transferCountdown, pendingTransfer } = get();

                if (transferCountdown === null || transferCountdown <= 0 || !pendingTransfer) {
                    clearInterval(countdownInterval);
                    return;
                }

                const newCountdown = transferCountdown - 1;
                set({ transferCountdown: newCountdown });

                if (newCountdown <= 0) {
                    clearInterval(countdownInterval);

                    if (pendingTransfer.confirmRequired) {
                        get().cancelTransfer();
                    }
                }
            }, 1000);
        },

        initiateTransfer: (fromSource, toSource) => {
            const confirmRequired = fromSource === 'remote' && toSource === 'local';

            set({
                pendingTransfer: {
                    fromSource,
                    toSource,
                    confirmRequired,
                    timeout: confirmRequired ? 20 : 0
                },
                showTransferDialog: confirmRequired,
                transferCountdown: confirmRequired ? 20 : null
            });

            if (confirmRequired) {
                const countdownInterval = setInterval(() => {
                    const { transferCountdown, pendingTransfer } = get();

                    if (transferCountdown === null || transferCountdown <= 0 || !pendingTransfer) {
                        clearInterval(countdownInterval);
                        return;
                    }

                    const newCountdown = transferCountdown - 1;
                    set({ transferCountdown: newCountdown });

                    if (newCountdown <= 0) {
                        clearInterval(countdownInterval);

                        if (pendingTransfer.confirmRequired) {
                            get().cancelTransfer();
                        }
                    }
                }, 1000);
            }
        },

        confirmTransfer: () => {
            const { pendingTransfer } = get();

            if (pendingTransfer) {
                set({
                    activeControlSource: pendingTransfer.toSource,
                    pendingTransfer: null,
                    showTransferDialog: false,
                    transferCountdown: null
                });
            }
        },

        cancelTransfer: () => {
            set({
                pendingTransfer: null,
                showTransferDialog: false,
                transferCountdown: null
            });
        },

        acceptTransfer: () => {
            get().confirmTransfer();
        },

        declineTransfer: () => {
            get().cancelTransfer();
        },

        play: (item) => {
            const { activeControlSource, controlCapabilities } = get();

            for (const source of CONTROL_PRIORITY) {
                if (source === activeControlSource || source === 'local') {
                    const caps = controlCapabilities[source];
                    if (caps.canPlay) {
                        set({ activeControlSource: source });
                        return true;
                    }
                }
            }

            return false;
        },

        pause: () => {
            const { activeControlSource, controlCapabilities } = get();

            for (const source of CONTROL_PRIORITY) {
                if (source === activeControlSource || source === 'local') {
                    const caps = controlCapabilities[source];
                    if (caps.canPause) {
                        set({ activeControlSource: source });
                        return true;
                    }
                }
            }

            return false;
        },

        stop: () => {
            const { activeControlSource, controlCapabilities } = get();

            for (const source of CONTROL_PRIORITY) {
                if (source === activeControlSource || source === 'local') {
                    const caps = controlCapabilities[source];
                    if (caps.canPause) {
                        set({ activeControlSource: source });
                        return true;
                    }
                }
            }

            return false;
        },

        seek: (time) => {
            const { activeControlSource, controlCapabilities } = get();

            for (const source of CONTROL_PRIORITY) {
                if (source === activeControlSource || source === 'local') {
                    const caps = controlCapabilities[source];
                    if (caps.canSeek) {
                        set({ activeControlSource: source });
                        return true;
                    }
                }
            }

            return false;
        },

        setVolume: (volume) => {
            const { activeControlSource, controlCapabilities } = get();

            for (const source of CONTROL_PRIORITY) {
                if (source === activeControlSource || source === 'local') {
                    const caps = controlCapabilities[source];
                    if (caps.canChangeVolume) {
                        set({ activeControlSource: source });
                        return true;
                    }
                }
            }

            return false;
        },

        toggleMute: () => {
            const { activeControlSource, controlCapabilities } = get();

            for (const source of CONTROL_PRIORITY) {
                if (source === activeControlSource || source === 'local') {
                    const caps = controlCapabilities[source];
                    if (caps.canChangeVolume) {
                        set({ activeControlSource: source });
                        return true;
                    }
                }
            }

            return false;
        },

        nextTrack: () => {
            const { activeControlSource, controlCapabilities } = get();

            for (const source of CONTROL_PRIORITY) {
                if (source === activeControlSource || source === 'local') {
                    const caps = controlCapabilities[source];
                    if (caps.canPlay) {
                        set({ activeControlSource: source });
                        return true;
                    }
                }
            }

            return false;
        },

        prevTrack: () => {
            const { activeControlSource, controlCapabilities } = get();

            for (const source of CONTROL_PRIORITY) {
                if (source === activeControlSource || source === 'local') {
                    const caps = controlCapabilities[source];
                    if (caps.canPlay) {
                        set({ activeControlSource: source });
                        return true;
                    }
                }
            }

            return false;
        },

        togglePlayPause: () => {
            return get().pause() || get().play();
        },

        canControl: (action) => {
            const { activeControlSource, controlCapabilities } = get();

            for (const source of CONTROL_PRIORITY) {
                if (source === activeControlSource || source === 'local') {
                    const caps = controlCapabilities[source];

                    switch (action) {
                        case 'play':
                            return caps.canPlay;
                        case 'pause':
                            return caps.canPause;
                        case 'stop':
                            return caps.canPause;
                        case 'seek':
                            return caps.canSeek;
                        case 'volume':
                            return caps.canChangeVolume;
                        case 'next':
                        case 'prev':
                            return caps.canPlay;
                        default:
                            return false;
                    }
                }
            }

            return false;
        },

        getControlSourceForAction: (action) => {
            const { activeControlSource, controlCapabilities } = get();

            for (const source of CONTROL_PRIORITY) {
                if (source === activeControlSource || source === 'local') {
                    const caps = controlCapabilities[source];

                    switch (action) {
                        case 'play':
                        case 'next':
                        case 'prev':
                            if (caps.canPlay) return source;
                            break;
                        case 'pause':
                        case 'stop':
                            if (caps.canPause) return source;
                            break;
                        case 'seek':
                            if (caps.canSeek) return source;
                            break;
                        case 'volume':
                            if (caps.canChangeVolume) return source;
                            break;
                    }
                }
            }

            return 'local';
        },

        setShowTransferDialog: (show) => {
            set({ showTransferDialog: show });
        },

        setTransferCountdown: (countdown) => {
            set({ transferCountdown: countdown });
        },

        reset: () => {
            set(initialState);
        }
    }))
);

// Selectors
export const selectActiveControlSource = (state: ControlState & ControlActions) => state.activeControlSource;
export const selectIsRemoteActive = (state: ControlState & ControlActions) => state.isRemoteActive();
export const selectPendingTransfer = (state: ControlState & ControlActions) => state.pendingTransfer;
export const selectShowTransferDialog = (state: ControlState & ControlActions) => state.showTransferDialog;
export const selectTransferCountdown = (state: ControlState & ControlActions) => state.transferCountdown;
export const selectRemoteConnected = (state: ControlState & ControlActions) => state.remoteConnected;
export const selectRemoteClientName = (state: ControlState & ControlActions) => state.remoteClientName;
export const selectCanControl = (state: ControlState & ControlActions) =>
    (action: 'play' | 'pause' | 'stop' | 'seek' | 'volume' | 'next' | 'prev') =>
        state.canControl(action);
