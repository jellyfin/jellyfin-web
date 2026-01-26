/**
 * NowPlaying UI Primitives
 *
 * Components for the unified NowPlaying experience with:
 * - CrossfadeWaveSurfer: WaveSurfer with crossfade visualization (DEPRECATED - use SeekSlider with showWaveform)
 * - CrossfadeSeeker: Desktop seek bar with waveform background (DEPRECATED - use SeekSlider)
 * - MobileCrossfadeSeeker: Touch-optimized seeker with swipe gestures
 * - AlbumArt: Album artwork with fallback
 * - DiscImage: Spinning vinyl/CD disc
 * - MetadataDisplay: Track metadata (title, artist, album)
 * - Backdrop: Full-screen backdrop with blur
 * - NowPlayingPage: Full-screen unified player
 * - Motion animations for timing-based UI
 * - Support for large displays and sitback mode
 */

/**
 * @deprecated Use Waveform from 'ui-primitives/seek/Waveform' instead.
 * This component will be removed in a future version.
 */
export { CrossfadeWaveSurfer } from './CrossfadeWaveSurfer';
export type { CrossfadeWaveSurferProps, TrackState } from './CrossfadeWaveSurfer';

/**
 * @deprecated Use SeekSlider from 'ui-primitives/SeekSlider' with showWaveform=true instead.
 * This component will be removed in a future version.
 */
export { CrossfadeSeeker } from './CrossfadeSeeker';
export type { CrossfadeSeekerProps } from './CrossfadeSeeker';

export { MobileCrossfadeSeeker } from './MobileCrossfadeSeeker';
export type { MobileCrossfadeSeekerProps } from './MobileCrossfadeSeeker';

export { AlbumArt } from './AlbumArt';
export type { AlbumArtProps } from './AlbumArt';

export { DiscImage } from './DiscImage';
export type { DiscImageProps } from './DiscImage';

export { MetadataDisplay } from './MetadataDisplay';
export type { MetadataDisplayProps } from './MetadataDisplay';

export { Backdrop } from './Backdrop';
export type { BackdropProps } from './Backdrop';

export { NowPlayingPage } from './NowPlayingPage';
export type { NowPlayingPageProps } from './NowPlayingPage';
