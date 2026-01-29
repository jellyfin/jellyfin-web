/**
 * UI State Store - Interface State Management
 *
 * Zustand store for managing UI state with timing animations.
 * This store handles:
 * - Idle state (sitback mode)
 * - OSD visibility (volume, brightness)
 * - Controls visibility (video, nowplaying)
 * - Technical info panel
 * - Song info display timing
 *
 * Used for consistent state management across components and
 * preventing memory leaks from orphaned timeouts.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

type ControlsType = 'video' | 'nowplaying' | 'none';
type OSDType = 'volume' | 'brightness' | 'none';

interface UIState {
    // Idle State (Sitback Mode)
    isIdle: boolean;
    idleTimeout: number; // ms before idle (default: 5000)
    lastInteraction: number;
    setIdle: (idle: boolean) => void;
    resetIdleTimer: () => void;

    // OSD Visibility (Volume, Brightness)
    osdVisible: boolean;
    osdType: OSDType;
    osdValue: number; // 0-100
    osdTimeoutId: ReturnType<typeof setTimeout> | null;
    showOSD: (type: OSDType, value: number) => void;
    hideOSD: () => void;

    // Controls Visibility (Video, NowPlaying)
    controlsVisible: boolean;
    controlsType: ControlsType;
    controlsTimeoutId: ReturnType<typeof setTimeout> | null;
    showControls: (type: ControlsType) => void;
    hideControls: () => void;
    resetControlsTimer: (duration?: number) => void;

    // Technical Info Panel
    technicalInfoVisible: boolean;
    toggleTechnicalInfo: () => void;

    // Song Info Display (Sitback Mode)
    songInfoVisible: boolean;
    songInfoTimeoutId: ReturnType<typeof setTimeout> | null;
    showSongInfo: (duration?: number) => void;
    hideSongInfo: () => void;

    // Queue Auto-scroll
    queueAutoScrollEnabled: boolean;
    toggleQueueAutoScroll: () => void;
}

export const useUIStateStore = create<UIState>()(
    subscribeWithSelector((set, get) => ({
        // Idle State
        isIdle: false,
        idleTimeout: 5000,
        lastInteraction: Date.now(),
        setIdle: (isIdle) => set({ isIdle }),
        resetIdleTimer: () => {
            set({
                isIdle: false,
                lastInteraction: Date.now()
            });
        },

        // OSD Visibility
        osdVisible: false,
        osdType: 'none',
        osdValue: 0,
        osdTimeoutId: null,
        showOSD: (type, value) => {
            const { osdTimeoutId } = get() as UIState & {
                osdTimeoutId?: ReturnType<typeof setTimeout>;
            };
            if (osdTimeoutId != null) clearTimeout(osdTimeoutId);
            set({
                osdVisible: true,
                osdType: type,
                osdValue: value,
                osdTimeoutId: setTimeout(() => {
                    set({ osdVisible: false, osdType: 'none' });
                }, 3000)
            });
        },
        hideOSD: () => set({ osdVisible: false, osdType: 'none' }),

        // Controls Visibility
        controlsVisible: true,
        controlsType: 'none',
        controlsTimeoutId: null,
        showControls: (type) => {
            const { controlsTimeoutId } = get();
            if (controlsTimeoutId) clearTimeout(controlsTimeoutId);
            set({
                controlsVisible: true,
                controlsType: type
            });
        },
        hideControls: () => set({ controlsVisible: false }),
        resetControlsTimer: (duration = 3000) => {
            const { showControls, controlsType, controlsTimeoutId } = get();
            if (controlsTimeoutId) clearTimeout(controlsTimeoutId);
            showControls(controlsType);
            set({
                controlsTimeoutId: setTimeout(() => {
                    set({ controlsVisible: false });
                }, duration)
            });
        },

        // Technical Info Panel
        technicalInfoVisible: false,
        toggleTechnicalInfo: () =>
            set((state) => ({
                technicalInfoVisible: !state.technicalInfoVisible
            })),

        // Song Info Display
        songInfoVisible: false,
        songInfoTimeoutId: null as ReturnType<typeof setTimeout> | null,
        showSongInfo: (duration = 5000) => {
            const { songInfoTimeoutId } = get() as UIState & {
                songInfoTimeoutId?: ReturnType<typeof setTimeout>;
            };
            if (songInfoTimeoutId != null) clearTimeout(songInfoTimeoutId);
            set({
                songInfoVisible: true,
                songInfoTimeoutId: setTimeout(() => {
                    set({ songInfoVisible: false });
                }, duration)
            });
        },
        hideSongInfo: () => {
            const { songInfoTimeoutId } = get() as UIState & {
                songInfoTimeoutId?: ReturnType<typeof setTimeout>;
            };
            if (songInfoTimeoutId != null) clearTimeout(songInfoTimeoutId);
            set({ songInfoVisible: false });
        },

        // Queue Auto-scroll
        queueAutoScrollEnabled: true,
        toggleQueueAutoScroll: () =>
            set((state) => ({
                queueAutoScrollEnabled: !state.queueAutoScrollEnabled
            }))
    }))
);

// Selectors for common use cases
export const useIsIdle = () => useUIStateStore((state) => state.isIdle);
export const useOSDVisibility = () =>
    useUIStateStore((state) => ({
        visible: state.osdVisible,
        type: state.osdType,
        value: state.osdValue
    }));
export const useControlsVisibility = () =>
    useUIStateStore((state) => ({
        visible: state.controlsVisible,
        type: state.controlsType
    }));
export const useTechnicalInfo = () => useUIStateStore((state) => state.technicalInfoVisible);
export const useSongInfoVisibility = () => useUIStateStore((state) => state.songInfoVisible);
export const useQueueAutoScroll = () => useUIStateStore((state) => state.queueAutoScrollEnabled);
