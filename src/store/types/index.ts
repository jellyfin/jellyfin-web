/**
 * Store Type Index
 *
 * Central type exports for all store-related types.
 */

// Re-export specific types to avoid conflicts
export type {
    AudioTrack,
    MediaImage,
    MediaType,
    PlayableItem,
    PlaybackProgress,
    PlaybackState,
    PlaybackStatus,
    PlayerInfo,
    QueueItem,
    QueueState,
    RepeatMode,
    ShuffleMode,
    StreamInfo,
    SubtitleTrack,
    TrackInfo,
    TransferInfo
} from './media';

// Quality types
export type * from './quality';

// Generic store types
export interface StoreState<T> {
    getState(): T;
    setState(partial: Partial<T> | ((state: T) => Partial<T>)): void;
}

export interface StoreAction<T> {
    (payload: T): void;
}

export interface StoreSelector<T, R> {
    (state: T): R;
}

export interface StoreSubscriber<T> {
    (listener: (state: T, prevState: T) => void): () => void;
}

// Error handling types
export interface StoreError {
    message: string;
    code: string;
    timestamp: number;
    recoverable: boolean;
}

export interface ErrorBoundaryState {
    hasError: boolean;
    error: StoreError | null;
}

export interface ErrorHandler {
    (error: Error, context?: string): void;
}

// Persistence types
export interface PersistedState {
    version: number;
    data: Record<string, unknown>;
    timestamp: number;
}

export interface PersistenceConfig {
    name: string;
    version: number;
    migrate?: (oldState: unknown) => unknown;
}

// Action types
export interface Action<T = unknown> {
    type: string;
    payload?: T;
}

export interface AsyncAction<T = unknown> extends Action<T> {
    meta?: {
        optimistic?: boolean;
        rollback?: () => void;
    };
}

// Selector types
export interface TypedSelector<T> {
    (state: unknown): T;
}

export interface MemoizedSelector<T> extends TypedSelector<T> {
    clearCache: () => void;
}

// Performance types
export interface PerformanceMarker {
    name: string;
    startTime: number;
    duration?: number;
}

export interface PerformanceMeasure {
    operation: string;
    duration: number;
    timestamp: number;
}
