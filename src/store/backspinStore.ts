import { create } from 'zustand';
import type {
    DEFAULT_CONFIG,
    GestureType,
    ScratchParams,
    SeekParams,
    TransportAction,
    TransportConfig,
    TransportState
} from '../types/transport';

interface BackspinState {
    state: TransportState;
    rate: number;
    position: number;
    duration: number;
    isScratching: boolean;
    scratchVelocity: number;
    lastAction: TransportAction | null;
    lastGesture: GestureType | null;
    isExpanded: boolean;
    config: typeof DEFAULT_CONFIG;
    mediaElement: HTMLMediaElement | null;
    audioContext: AudioContext | null;

    setState: (state: TransportState) => void;
    setRate: (rate: number) => void;
    setPosition: (position: number) => void;
    setDuration: (duration: number) => void;
    setScratching: (isScratching: boolean, velocity?: number) => void;
    setLastAction: (action: TransportAction | null) => void;
    setLastGesture: (gesture: GestureType | null) => void;
    setExpanded: (expanded: boolean) => void;
    setMediaElement: (element: HTMLMediaElement | null) => void;
    setAudioContext: (ctx: AudioContext | null) => void;
    updateConfig: (updates: Partial<TransportConfig>) => void;
    reset: () => void;
}

const initialState = {
    state: 'LOCKED_PLAYING' as TransportState,
    rate: 1.0,
    position: 0,
    duration: 0,
    isScratching: false,
    scratchVelocity: 0,
    lastAction: null as TransportAction | null,
    lastGesture: null as GestureType | null,
    isExpanded: false,
    config: {
        pauseDurationMs: 650,
        resumeDurationMs: 450,
        stopDurationMs: 180,
        seekEndDurationMs: 300,
        readDelaySeconds: 1.0,
        bufferSeconds: 1.0,
        hapticEnabled: true,
        vinylNoiseEnabled: true
    },
    mediaElement: null as HTMLMediaElement | null,
    audioContext: null as AudioContext | null
};

export const useBackspinStore = create<BackspinState>((set, get) => ({
    ...initialState,

    setState: (state) => set({ state, lastAction: mapStateToAction(state) }),

    setRate: (rate) => set({ rate }),

    setPosition: (position) => set({ position }),

    setDuration: (duration) => set({ duration }),

    setScratching: (isScratching, velocity = 0) =>
        set({
            isScratching,
            scratchVelocity: velocity,
            state: isScratching ? 'SCRATCH_DRAG' : get().state
        }),

    setLastAction: (action) => set({ lastAction: action }),

    setLastGesture: (gesture) => set({ lastGesture: gesture }),

    setExpanded: (expanded) => set({ isExpanded: expanded }),

    setMediaElement: (element) => set({ mediaElement: element }),

    setAudioContext: (ctx) => set({ audioContext: ctx }),

    updateConfig: (updates) =>
        set((state) => ({
            config: { ...state.config, ...updates }
        })),

    reset: () => set({ ...initialState })
}));

function mapStateToAction(state: TransportState): TransportAction | null {
    switch (state) {
        case 'LOCKED_PLAYING':
            return 'play';
        case 'PAUSING_SLOWDOWN':
        case 'PAUSED_HELD':
            return 'pause';
        case 'STOPPING_BRAKE':
            return 'stop';
        case 'SCRATCH_DRAG':
            return 'scratch';
        case 'SEEK_END':
        case 'SEEK_END_PAUSED':
            return 'seek';
        default:
            return null;
    }
}

export function isPlayState(state: TransportState): boolean {
    return state === 'LOCKED_PLAYING' || state === 'RESUMING_SPINUP';
}

export function isPauseState(state: TransportState): boolean {
    return state === 'PAUSED_HELD' || state === 'PAUSING_SLOWDOWN';
}

export function canPause(state: TransportState): boolean {
    return isPlayState(state) || state === 'SCRATCH_DRAG';
}

export function canPlay(state: TransportState): boolean {
    return isPauseState(state) || state === 'STOPPING_BRAKE' || state === 'SEEK_END_PAUSED';
}

export function canStop(state: TransportState): boolean {
    return isPlayState(state) || state === 'SCRATCH_DRAG' || state === 'SEEK_END';
}

export function canSeek(state: TransportState): boolean {
    return state === 'LOCKED_PLAYING' || state === 'SCRATCH_DRAG';
}
