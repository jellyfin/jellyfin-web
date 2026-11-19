import { MILLISECONDS_PER_HOUR } from 'constants/time';

/** The unique ID for the still watching plugin. */
export const ID = 'still-watching';

interface StillWatchingInfo {
    /** The minimum number of items that must be played before showing the prompt. */
    count: number
    /** The minimum duration of the play session and idle time before showing the prompt. */
    duration: number
}

/** The options for the still watching prompt. */
export enum StillWatchingOptions {
    Disabled = 'disabled',
    Short = 'short',
    Default = 'default',
    Long = 'long',
    VeryLong = 'veryLong'
}

/** The configuration for the still watching prompt. */
export const StillWatchingConfiguration: Record<StillWatchingOptions, StillWatchingInfo> = {
    [StillWatchingOptions.Disabled]: { count: Infinity, duration: Infinity },
    [StillWatchingOptions.Short]: { count: 2, duration: 1 * MILLISECONDS_PER_HOUR },
    [StillWatchingOptions.Default]: { count: 3, duration: 1.5 * MILLISECONDS_PER_HOUR },
    [StillWatchingOptions.Long]: { count: 5, duration: 2.5 * MILLISECONDS_PER_HOUR },
    [StillWatchingOptions.VeryLong]: { count: 8, duration: 4 * MILLISECONDS_PER_HOUR }
} as const;
