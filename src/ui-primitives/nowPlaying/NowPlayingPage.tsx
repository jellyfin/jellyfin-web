/**
 * NowPlayingPage - Full-screen unified NowPlaying experience
 *
 * Composes all nowPlaying primitives:
 * - Backdrop with album art blur
 * - DiscImage or AlbumArt for artwork
 * - MetadataDisplay for track info
 * - CrossfadeSeeker/MobileCrossfadeSeeker for playback
 * - Visualizers (WaveformCell, FrequencyAnalyzer, ButterchurnViz)
 */

import { useEffect, useCallback, type ReactElement } from 'react';
import { Backdrop } from './Backdrop';
import { AlbumArt } from './AlbumArt';
import { DiscImage } from './DiscImage';
import { MetadataDisplay } from './MetadataDisplay';
import { CrossfadeSeeker } from './CrossfadeSeeker';
import { MobileCrossfadeSeeker } from './MobileCrossfadeSeeker';
import { WaveformCell, FrequencyAnalyzer, ButterchurnViz } from '../visualizers';
import { useAudioStore } from 'store/audioStore';
import { useUIStateStore } from 'store/uiStateStore';
import { useVisualizerStore } from 'store/visualizerStore';
import {
    pageContainer,
    artworkContainer,
    metadataContainer,
    seekerContainer,
    visualizerContainer,
    controlsContainer,
    controlButton,
    playButton,
    icon
} from './NowPlayingPage.css';

export interface NowPlayingPageProps {
    readonly onClose?: () => void;
    readonly isMobile?: boolean;
}

export function NowPlayingPage({ isMobile = false }: NowPlayingPageProps): ReactElement {
    const audioState = useAudioStore();
    const uiState = useUIStateStore();
    const visualizerState = useVisualizerStore();

    const { currentTrack, isPlaying, currentTime, duration } = audioState;
    const { setIdle } = uiState;

    useEffect((): (() => void) => {
        let timeoutId: ReturnType<typeof setTimeout>;

        const resetIdle = (): void => {
            setIdle(false);
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => setIdle(true), 5000);
        };

        resetIdle();

        const handleActivity = (): void => resetIdle();
        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keydown', handleActivity);
        window.addEventListener('touchstart', handleActivity);

        return (): void => {
            clearTimeout(timeoutId);
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            window.removeEventListener('touchstart', handleActivity);
        };
    }, [setIdle]);

    const handleSeek = useCallback((_time: number): void => {
        // In a real implementation, this would call playbackManager.seek(time)
    }, []);

    const handlePlayPause = useCallback((): void => {
        // In a real implementation, this would call playbackManager.playPause()
    }, []);

    const handlePrevious = useCallback((): void => {
        // In a real implementation, this would call playbackManager.previous()
    }, []);

    const handleNext = useCallback((): void => {
        // In a real implementation, this would call playbackManager.next()
    }, []);

    const SeekerComponent = isMobile ? MobileCrossfadeSeeker : CrossfadeSeeker;

    const trackPeaks = currentTrack?.id !== undefined && currentTrack?.id !== '' ? [] : undefined;

    return (
        <>
            <div className={visualizerContainer}>
                {visualizerState.type === 'waveform' && (
                    <WaveformCell peaks={trackPeaks} duration={duration} currentTime={currentTime} />
                )}
                {visualizerState.type === 'frequency' && <FrequencyAnalyzer colorScheme='spectrum' barCount={64} />}
                {visualizerState.type === 'butterchurn' && <ButterchurnViz preset='default' />}
            </div>

            <Backdrop src={currentTrack?.imageUrl ?? null} />

            <div className={pageContainer}>
                <div className={artworkContainer}>
                    {isPlaying ? (
                        <DiscImage src={currentTrack?.imageUrl ?? null} isPlaying={isPlaying} size={300} />
                    ) : (
                        <AlbumArt src={currentTrack?.imageUrl ?? null} size={300} />
                    )}
                </div>

                <div className={metadataContainer}>
                    <MetadataDisplay
                        title={currentTrack?.name ?? null}
                        artist={currentTrack?.artist ?? null}
                        album={currentTrack?.album ?? null}
                        size='lg'
                    />
                </div>

                <div className={seekerContainer}>
                    <SeekerComponent
                        currentTrack={{
                            id: currentTrack?.id ?? '',
                            url: currentTrack?.streamInfo?.url ?? '',
                            peaks: trackPeaks
                        }}
                        currentTime={currentTime}
                        duration={duration}
                        isPlaying={isPlaying}
                        isCrossfading={false}
                        onSeek={handleSeek}
                        height={isMobile ? 80 : 60}
                    />
                </div>

                <div className={controlsContainer}>
                    <button type='button' className={controlButton} onClick={handlePrevious} aria-label='Previous'>
                        <svg className={icon} viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
                            <path d='M6 6h2v12H6zm3.5 6l8.5 6V6z' />
                        </svg>
                    </button>

                    <button
                        type='button'
                        className={playButton}
                        onClick={handlePlayPause}
                        aria-label={isPlaying ? 'Pause' : 'Play'}
                    >
                        <svg className={icon} viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
                            {isPlaying ? <path d='M6 19h4V5H6v14zm8-14v14h4V5h-4z' /> : <path d='M8 5v14l11-7z' />}
                        </svg>
                    </button>

                    <button type='button' className={controlButton} onClick={handleNext} aria-label='Next'>
                        <svg className={icon} viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
                            <path d='M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z' />
                        </svg>
                    </button>
                </div>
            </div>
        </>
    );
}
