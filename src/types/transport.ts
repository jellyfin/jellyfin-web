export type TransportState =
    | 'LOCKED_PLAYING'
    | 'PAUSING_SLOWDOWN'
    | 'PAUSED_HELD'
    | 'RESUMING_SPINUP'
    | 'STOPPING_BRAKE'
    | 'SCRATCH_DRAG'
    | 'SEEK_END'
    | 'SEEK_END_PAUSED';

export type TransportAction = 'pause' | 'play' | 'stop' | 'scratch' | 'seek' | 'return_to_cue';

export type GestureType =
    | 'tap'
    | 'double_tap'
    | 'long_press'
    | 'press_start'
    | 'press_end'
    | 'drag_start'
    | 'drag'
    | 'drag_end'
    | 'swipe'
    | 'pinch';

export type LatchMode = 'latching' | 'momentary';

export interface ScratchParams {
    velocity: number;
    delta: number;
    position: number;
    pressure: number;
    material: 'vinyl' | 'cd' | 'digital';
}

export interface SeekParams {
    delta: number;
    velocity: number;
    position: number;
    type: 'scratch_end' | 'return_to_cue' | 'jump';
}

export interface HapticPattern {
    pattern: number[];
    duration: number;
}

export const HAPTIC_PATTERNS: Record<string, HapticPattern> = {
    click: { pattern: [20], duration: 20 },
    brake_start: { pattern: [50, 30, 50], duration: 130 },
    spin_up_complete: { pattern: [30, 50, 80], duration: 160 },
    scratch: { pattern: [10, 5, 10, 5], duration: 30 },
    seek_start: { pattern: [15], duration: 15 },
    double_tap: { pattern: [10, 10, 20], duration: 40 },
    wavesurfer_expand: { pattern: [25], duration: 25 },
    pinch_zoom: { pattern: [8], duration: 8 }
} as const;

export interface TransportConfig {
    pauseDurationMs: number;
    resumeDurationMs: number;
    stopDurationMs: number;
    seekEndDurationMs: number;
    readDelaySeconds: number;
    bufferSeconds: number;
    hapticEnabled: boolean;
    vinylNoiseEnabled: boolean;
}

export const DEFAULT_CONFIG: TransportConfig = {
    pauseDurationMs: 650,
    resumeDurationMs: 450,
    stopDurationMs: 180,
    seekEndDurationMs: 300,
    readDelaySeconds: 1.0,
    bufferSeconds: 1.0,
    hapticEnabled: true,
    vinylNoiseEnabled: true
} as const;

export interface TransportStateInfo {
    state: TransportState;
    rate: number;
    isPlaying: boolean;
    isPaused: boolean;
    isScratching: boolean;
    canPause: boolean;
    canPlay: boolean;
    canStop: boolean;
    canSeek: boolean;
}
