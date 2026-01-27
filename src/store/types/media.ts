/**
 * Media Types
 *
 * Type definitions for media-related structures used across stores.
 */

export type MediaType = 'Audio' | 'Video' | 'Photo' | 'Book' | 'Unknown';

export interface PlayableItem {
    id: string;
    name: string;
    mediaType: MediaType;
    serverId: string;
    type?: string; // Jellyfin item type (e.g., 'MusicAlbum', 'MusicArtist')

    // Metadata
    title?: string;
    artist?: string;
    album?: string;
    albumArtist?: string;
    genre?: string[];
    year?: number;

    // Media info
    duration?: number; // in seconds
    runtimeTicks?: number;
    imageUrl?: string;
    artwork?: MediaImage[];

    // Stream info
    streamInfo?: StreamInfo;

    // User data
    isFavorite?: boolean;
    playbackPosition?: number; // in seconds

    // Playlist navigation
    nextItem?: PlayableItem | null;
    prevItem?: PlayableItem | null;
}

export interface MediaImage {
    url: string;
    width?: number;
    height?: number;
    type: 'Primary' | 'Backdrop' | 'Logo' | 'Thumb' | 'Disc';
}

export interface StreamInfo {
    url: string;
    bitrate?: number;
    container?: string;
    codec?: string;
    isExternal?: boolean;
    playMethod?: 'DirectPlay' | 'DirectStream' | 'Transcode';
    supportsDirectPlay?: boolean;
    supportedVideoTypes?: string[];
    supportedAudioTypes?: string[];
}

export interface AudioTrack {
    index: number;
    name: string;
    language?: string;
    codec?: string;
    bitrate?: number;
    channels?: number;
    isDefault?: boolean;
}

export interface SubtitleTrack {
    index: number;
    name: string;
    language?: string;
    format?: string;
    isDefault?: boolean;
    isForced?: boolean;
}

export interface TrackInfo {
    audioTracks: AudioTrack[];
    subtitleTracks: SubtitleTrack[];
    currentAudioTrack: number | null;
    currentSubtitleTrack: number | null;
}

export interface PlaybackProgress {
    currentTime: number; // in seconds
    duration: number; // in seconds
    percent: number; // 0-100
    buffered: number; // percentage buffered
    positionTicks?: number;
}

export interface PlaybackState {
    status: PlaybackStatus;
    currentItem: PlayableItem | null;
    progress: PlaybackProgress;
    repeatMode: RepeatMode;
    shuffleMode: ShuffleMode;
    volume: number;
    isMuted: boolean;
    playbackRate: number;
    audioTrack: number | null;
    subtitleTrack: number | null;
}

export type RepeatMode = 'RepeatNone' | 'RepeatAll' | 'RepeatOne';

export type ShuffleMode = 'Sorted' | 'Shuffle';

export type PlaybackStatus = 'idle' | 'buffering' | 'playing' | 'paused' | 'stopped' | 'error';

export interface PlayerInfo {
    name: string;
    id: string;
    isLocalPlayer: boolean;
    supportedCommands: string[];
    canPlayMediaTypes: MediaType[];
}

export interface TransferInfo {
    fromPlayer: PlayerInfo | null;
    toPlayer: PlayerInfo;
    preservePosition: boolean;
    autoplay: boolean;
}

export interface QueueItem {
    id: string;
    item: PlayableItem;
    index: number;
    addedAt: Date;
}

export interface QueueState {
    items: QueueItem[];
    currentIndex: number;
    startPosition: number;
    shuffleMode: ShuffleMode;
    repeatMode: RepeatMode;
}
