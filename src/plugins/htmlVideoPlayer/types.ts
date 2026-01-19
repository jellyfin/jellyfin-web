/**
 * Type definitions for HtmlVideoPlayer plugin
 */

// ============================================================================
// Play Options and Media Source Types
// ============================================================================

export interface PlayOptions {
    url: string;
    item?: MediaItem;
    mediaSource: MediaSource;
    playerStartPositionTicks?: number;
    playMethod?: 'DirectPlay' | 'Transcode' | 'Remux';
    fullscreen?: boolean;
    backdropUrl?: string;
    resetSubtitleOffset?: boolean;
    aspectRatio?: 'auto' | 'cover' | 'fill';
    transcodingOffsetTicks?: number;
    serverId?: string;
}

export interface MediaSource {
    RunTimeTicks?: number;
    Container?: string;
    MediaStreams: MediaStream[];
    DefaultSubtitleStreamIndex?: number;
    DefaultSecondarySubtitleStreamIndex?: number;
    DefaultAudioStreamIndex?: number;
    MediaAttachments?: Attachment[];
}

export interface MediaStream {
    Index: number;
    Type: 'Video' | 'Audio' | 'Subtitle' | 'EmbeddedImage';
    Codec?: string;
    CodecTag?: string;
    DeliveryMethod?: 'Encode' | 'Embed' | 'External' | 'Transcode';
    Title?: string;
    Language?: string;
    IsDefault?: boolean;
    IsForced?: boolean;
    Path?: string;
    ReferenceFrameRate?: number;
    Profile?: string;
    TimeBase?: string;
    DisplayTitle?: string;
    PixelFormat?: string;
    Level?: number;
    RefFrames?: number;
    IsAnamorphic?: boolean;
    ColorRange?: string;
    ColorSpace?: string;
    ColorTransfer?: string;
    ColorPrimaries?: string;
    BitRate?: number;
    Height?: number;
    Width?: number;
    AverageFrameRate?: number;
    Channels?: number;
    SampleRate?: number;
}

export interface MediaItem {
    Id?: string;
    Name?: string;
    Type?: string;
    ServerId?: string;
    IsPlaceHolder?: boolean;
}

export interface Attachment {
    DeliveryUrl?: string;
    MimeType?: string;
    Name?: string;
}

export interface StreamInfo {
    url: string;
    mediaSource: MediaSource;
    item: MediaItem;
    playMethod: string;
}

// ============================================================================
// Subtitle and Track Types
// ============================================================================

export interface TrackEvent {
    StartPositionTicks: number;
    EndPositionTicks: number;
    Text: string;
}

export interface SubtitleTrack {
    Index: number;
    DeliveryMethod?: 'Encode' | 'Embed' | 'External';
    IsExternal?: boolean;
    Path?: string;
    Codec?: string;
    Title?: string;
    Language?: string;
}

export interface SubtitleAppearance {
    text: Array<{ name: string; value: string }>;
    window?: Element;
    verticalPosition: number;
}

// ============================================================================
// Renderer Types
// ============================================================================

export interface SubtitlesOctopus {
    dispose(): void;
    timeOffset: number;
    resize(): void;
    resetRenderAheadCache(clear: boolean): void;
    setIssuesEndTime(): void;
    commitRender(): void;
}

export interface PgsRenderer {
    dispose(): void;
    timeOffset: number;
    aspectRatio: 'auto' | 'cover' | 'fill' | 'contain';
}

// ============================================================================
// Feature Types
// ============================================================================

export interface PictureInPictureFeatures {
    supported: boolean;
    enabled: boolean;
}

export interface AirPlayFeatures {
    supported: boolean;
    enabled: boolean;
}

export interface AspectRatioOption {
    name: string;
    id: 'auto' | 'cover' | 'fill';
}

export interface PlaybackRateOption {
    name: string;
    id: number;
}

export interface BufferedRange {
    start: number;
    end: number;
}

export interface PlaybackStats {
    categories: StatCategory[];
}

export interface StatCategory {
    type: 'media' | 'video' | 'audio' | 'subtitle';
    stats: StatItem[];
}

export interface StatItem {
    label: string;
    value: string | number;
}

// ============================================================================
// Device Profile Types
// ============================================================================

export interface DeviceProfile {
    CodecProfiles?: CodecProfile[];
    ContainerProfiles?: ContainerProfile[];
    DirectPlayProfiles?: DirectPlayProfile[];
    TranscodingProfiles?: TranscodingProfile[];
    MediaFeatures?: string[];
    ResponseProfiles?: ResponseProfile[];
}

export interface CodecProfile {
    Type?: string;
    Codec?: string;
    Conditions?: ProfileCondition[];
    ApplyConditions?: ProfileCondition[];
}

export interface ContainerProfile {
    Type?: string;
    Container?: string;
    Conditions?: ProfileCondition[];
}

export interface DirectPlayProfile {
    Type: 'Video' | 'Audio';
    Container?: string;
    AudioCodec?: string;
    VideoCodec?: string;
    Conditions?: ProfileCondition[];
}

export interface TranscodingProfile {
    Type: 'Video' | 'Audio' | 'Subtitle';
    Container?: string;
    AudioCodec?: string;
    VideoCodec?: string;
    Conditions?: ProfileCondition[];
    MinSegments?: number;
    SegmentLength?: number;
}

export interface ResponseProfile {
    Type?: string;
    Container?: string;
    AudioCodec?: string;
    VideoCodec?: string;
}

export interface ProfileCondition {
    Condition?: string;
    Property?: string;
    Value?: string;
    IsRequired?: boolean;
}

// ============================================================================
// HLS and Streaming Types
// ============================================================================

export interface HlsInstance {
    loadSource(url: string): void;
    attachMedia(element: HTMLMediaElement): void;
    on(event: string, callback: Function): void;
    off(event: string, callback: Function): void;
    destroy(): void;
}

export interface FlvPlayer {
    attachMediaElement(elem: HTMLMediaElement): void;
    load(): void;
    play(): Promise<void>;
    pause(): void;
    unload(): void;
    destroy(): void;
}

// ============================================================================
// DOM Element Extension Types
// ============================================================================

export interface DocumentWithPip {
    pictureInPictureEnabled?: boolean;
    exitPictureInPicture?(): Promise<void>;
    pictureInPictureElement?: Element;
}

export interface HTMLVideoElementWithPip {
    requestPictureInPicture?(): Promise<PictureInPictureWindow>;
    webkitSetPresentationMode?(mode: 'picture-in-picture' | 'inline'): void;
    webkitPresentationMode?: 'picture-in-picture' | 'inline';
}

export interface HTMLVideoElementWithAirPlay {
    requestAirPlay?(): Promise<void>;
    webkitShowPlaybackTargetPicker?(): void;
}

export interface PictureInPictureWindow {
    addEventListener(type: string, listener: EventListener): void;
    removeEventListener(type: string, listener: EventListener): void;
    width: number;
    height: number;
}

// ============================================================================
// Player State and Event Types
// ============================================================================

export interface PlayerState {
    NowPlayingItem?: MediaItem;
    PositionTicks?: number;
    PlayState?: {
        IsPaused?: boolean;
        RepeatMode?: string;
        IsMuted?: boolean;
        VolumeLevel?: number;
        ShuffleMode?: string;
    };
    [key: string]: any;
}

export interface MediaPlayerEvent extends Event {
    detail?: any;
}

// ============================================================================
// Internal State Types
// ============================================================================

export interface VideoPlayerState {
    isStarted: boolean;
    timeUpdated: boolean;
    currentTime: number | null;
    currentSrc: string | undefined;
    fetchQueue: number;
    isFetching: boolean;
    subtitleTrackIndexToSetOnPlaying?: number;
    secondarySubtitleTrackIndexToSetOnPlaying?: number;
    audioTrackIndexToSetOnPlaying: number | null;
    currentTrackOffset?: number;
    showTrackOffset?: boolean;
}

// ============================================================================
// Subtitle Rendering Types
// ============================================================================

export type SubtitleRenderMethod = 'native' | 'ass' | 'pgs' | 'custom';

export interface SubtitleRenderConfig {
    method: SubtitleRenderMethod;
    isExternal: boolean;
    codec?: string;
    deliveryMethod?: string;
}

// ============================================================================
// Browser Extension Types
// ============================================================================

export interface BrowserFeatures {
    tv: boolean;
    web0s: boolean;
    mobile: boolean;
    chrome: boolean;
    safari: boolean;
    firefox: boolean;
    edge: boolean;
    edgeChromium: boolean;
    edgeUwp: boolean;
    tizen: boolean;
    touch: boolean;
    iOS: boolean;
    iosVersion?: number;
    ps4: boolean;
    tizenVersion: string;
    supportsCssAnimation(): boolean;
}

// ============================================================================
// Window and DOM Element Extensions
// ============================================================================

declare global {
    interface Window {
        Hls?: any;
    }
}

export interface HTMLVideoElementWithAudioTracks extends HTMLVideoElement {
    audioTracks?: AudioTrackList;
}

export interface AudioTrackList {
    length: number;
    [index: number]: AudioTrack;
    getTrackById(id: string): AudioTrack | null;
}

export interface AudioTrack {
    enabled: boolean;
    id: string;
    kind: string;
    label: string;
    language: string;
}
