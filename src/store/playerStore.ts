/**
 * Player Store - Player Management
 *
 * Zustand store for managing player state and capabilities.
 * Handles player selection, device transfer, and player-specific features.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { PlayerInfo, TransferInfo, MediaType } from './types';

export interface PlayerState {
    // Current player
    currentPlayer: PlayerInfo | null;
    availablePlayers: PlayerInfo[];

    // Transfer state
    pendingTransfer: TransferInfo | null;
    isTransferring: boolean;
    transferProgress: number;

    // Player capabilities
    activePlayers: Map<string, PlayerInfo>;
    lastKnownPlayers: PlayerInfo[];

    // Player events
    playerChanged: { from: PlayerInfo | null; to: PlayerInfo } | null;
}

export interface PlayerActions {
    // Player management
    setCurrentPlayer: (player: PlayerInfo | null) => void;
    addPlayer: (player: PlayerInfo) => void;
    removePlayer: (playerId: string) => void;
    updatePlayer: (playerId: string, updates: Partial<PlayerInfo>) => void;

    // Player enumeration
    getAvailablePlayers: () => PlayerInfo[];
    getActivePlayers: () => PlayerInfo[];

    // Transfer management
    initiateTransfer: (info: TransferInfo) => void;
    confirmTransfer: () => void;
    cancelTransfer: () => void;
    updateTransferProgress: (progress: number) => void;

    // Player selection
    selectPlayer: (playerId: string) => boolean;
    autoSelectBestPlayer: (mediaType: MediaType) => PlayerInfo | null;
    selectLocalPlayer: () => PlayerInfo | null;

    // Capability queries
    canPlayMediaType: (mediaType: MediaType) => boolean;
    getPlayerById: (playerId: string) => PlayerInfo | null;
    isLocalPlayerActive: () => boolean;

    // Event handling
    setPlayerChanged: (change: { from: PlayerInfo | null; to: PlayerInfo } | null) => void;
    clearPlayerChanged: () => void;

    // State reset
    reset: () => void;
}

const createDefaultPlayer = (): PlayerInfo => ({
    name: 'Default Audio Player',
    id: 'default-audio',
    isLocalPlayer: true,
    supportedCommands: [
        'play',
        'pause',
        'stop',
        'seek',
        'volume',
        'mute'
    ],
    canPlayMediaTypes: ['Audio', 'Video', 'Photo', 'Book']
});

const createHTML5Player = (): PlayerInfo => ({
    name: 'HTML5 Video Player',
    id: 'html5-video',
    isLocalPlayer: true,
    supportedCommands: [
        'play',
        'pause',
        'stop',
        'seek',
        'volume',
        'mute',
        'playbackRate',
        'fullscreen'
    ],
    canPlayMediaTypes: ['Audio', 'Video', 'Photo']
});

const initialState: PlayerState = {
    currentPlayer: createDefaultPlayer(),
    availablePlayers: [createDefaultPlayer(), createHTML5Player()],
    pendingTransfer: null,
    isTransferring: false,
    transferProgress: 0,
    activePlayers: new Map(),
    lastKnownPlayers: [],
    playerChanged: null
};

export const usePlayerStore = create<PlayerState & PlayerActions>()(
    subscribeWithSelector((set, get) => ({
        ...initialState,

        setCurrentPlayer: (player) => {
            set({ currentPlayer: player });
        },

        addPlayer: (player) => {
            const { availablePlayers } = get();

            if (!availablePlayers.find(p => p.id === player.id)) {
                set({
                    availablePlayers: [...availablePlayers, player],
                    activePlayers: new Map(get().activePlayers).set(player.id, player)
                });
            }
        },

        removePlayer: (playerId) => {
            const { availablePlayers, currentPlayer } = get();

            const filtered = availablePlayers.filter(p => p.id !== playerId);

            set({
                availablePlayers: filtered,
                currentPlayer: currentPlayer?.id === playerId ? null : currentPlayer,
                activePlayers: (() => {
                    const map = new Map(get().activePlayers);
                    map.delete(playerId);
                    return map;
                })()
            });
        },

        updatePlayer: (playerId, updates) => {
            const { availablePlayers } = get();

            const updated = availablePlayers.map(p =>
                p.id === playerId ? { ...p, ...updates } : p
            );

            set({
                availablePlayers: updated,
                activePlayers: new Map(get().activePlayers).set(playerId, { ...get().activePlayers.get(playerId), ...updates } as PlayerInfo)
            });
        },

        getAvailablePlayers: () => {
            return get().availablePlayers;
        },

        getActivePlayers: () => {
            const { activePlayers } = get();
            return Array.from(activePlayers.values());
        },

        initiateTransfer: (info) => {
            set({
                pendingTransfer: info,
                isTransferring: true,
                transferProgress: 0
            });
        },

        confirmTransfer: () => {
            const { pendingTransfer, currentPlayer } = get();

            if (pendingTransfer) {
                set({
                    playerChanged: {
                        from: currentPlayer,
                        to: pendingTransfer.toPlayer
                    },
                    currentPlayer: pendingTransfer.toPlayer,
                    pendingTransfer: null,
                    isTransferring: false,
                    transferProgress: 100
                });
            }
        },

        cancelTransfer: () => {
            set({
                pendingTransfer: null,
                isTransferring: false,
                transferProgress: 0
            });
        },

        updateTransferProgress: (progress) => {
            set({ transferProgress: progress });
        },

        selectPlayer: (playerId) => {
            const { availablePlayers } = get();
            const player = availablePlayers.find(p => p.id === playerId);

            if (player) {
                set({
                    currentPlayer: player,
                    playerChanged: {
                        from: get().currentPlayer,
                        to: player
                    }
                });
                return true;
            }

            return false;
        },

        autoSelectBestPlayer: (mediaType) => {
            const { availablePlayers, currentPlayer } = get();

            if (currentPlayer && currentPlayer.canPlayMediaTypes.includes(mediaType)) {
                return currentPlayer;
            }

            const localPlayers = availablePlayers.filter(p =>
                p.isLocalPlayer && p.canPlayMediaTypes.includes(mediaType)
            );

            if (localPlayers.length > 0) {
                return localPlayers[0];
            }

            return availablePlayers.find(p =>
                p.canPlayMediaTypes.includes(mediaType)
            ) || null;
        },

        selectLocalPlayer: () => {
            const { availablePlayers } = get();

            return availablePlayers.find(p => p.isLocalPlayer) || null;
        },

        canPlayMediaType: (mediaType) => {
            const { currentPlayer } = get();

            if (!currentPlayer) {
                const { availablePlayers } = get();
                return availablePlayers.some(p => p.canPlayMediaTypes.includes(mediaType));
            }

            return currentPlayer.canPlayMediaTypes.includes(mediaType);
        },

        getPlayerById: (playerId) => {
            return get().availablePlayers.find(p => p.id === playerId) || null;
        },

        isLocalPlayerActive: () => {
            const { currentPlayer } = get();
            return currentPlayer?.isLocalPlayer ?? false;
        },

        setPlayerChanged: (change) => {
            set({ playerChanged: change });
        },

        clearPlayerChanged: () => {
            set({ playerChanged: null });
        },

        reset: () => {
            set(initialState);
        }
    }))
);

// Selectors
export const selectCurrentPlayer = (state: PlayerState & PlayerActions) => state.currentPlayer;
export const selectAvailablePlayers = (state: PlayerState & PlayerActions) => state.availablePlayers;
export const selectPendingTransfer = (state: PlayerState & PlayerActions) => state.pendingTransfer;
export const selectIsTransferring = (state: PlayerState & PlayerActions) => state.isTransferring;
export const selectIsLocalPlayerActive = (state: PlayerState & PlayerActions) => state.isLocalPlayerActive();
export const selectPlayerChanged = (state: PlayerState & PlayerActions) => state.playerChanged;
