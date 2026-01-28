import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import './nowPlayingBar.scss';
import { DiscIcon } from '@radix-ui/react-icons';

import { PlaybackIconButton, AutoDJToggle } from '../playback';

import { VolumeSlider } from 'ui-primitives/VolumeSlider';
import { SeekSlider } from 'ui-primitives/SeekSlider';

import {
    useIsPlaying,
    useCurrentItem,
    useCurrentTime,
    useDuration,
    useVolume,
    useIsMuted,
    useRepeatMode,
    useShuffleMode,
    usePlaybackActions,
    useQueueActions,
    useFormattedTime,
    useCurrentQueueIndex,
    useCurrentPlayer,
    useNotificationStore,
    useCrossfadeStore
} from '../../store';
import type { PlayableItem, PlayerInfo } from '../../store/types';

import layoutManager from '../layoutManager';
import Events from '../../utils/events';
import { appRouter } from '../router/appRouter';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { playbackManagerBridge } from '../../store/playbackManagerBridge';
import { logger } from '../../utils/logger';
import { AspectRatio } from 'ui-primitives/AspectRatio';
import { Box, Flex } from 'ui-primitives/Box';
import { Text } from 'ui-primitives/Text';
import { vars } from 'styles/tokens.css';

export const NowPlayingBar: React.FC = () => {
    const isPlaying = useIsPlaying();
    const currentItem = useCurrentItem();
    const currentTime = useCurrentTime();
    const duration = useDuration();
    const volume = useVolume();
    const muted = useIsMuted();
    const repeatMode = useRepeatMode();
    const shuffleMode = useShuffleMode();
    const currentQueueIndex = useCurrentQueueIndex();
    const currentPlayer = useCurrentPlayer();
    const { currentTimeFormatted, durationFormatted } = useFormattedTime();

    const { togglePlayPause, stop, seek, seekPercent, setVolume, toggleMute } = usePlaybackActions();
    const { next, previous, toggleRepeatMode, toggleShuffleMode } = useQueueActions();

    const crossfadeEnabled = useCrossfadeStore(state => state.enabled);
    const crossfadeDuration = useCrossfadeStore(state => state.duration);
    const crossfadeBusy = useCrossfadeStore(state => state.busy);
    const setCrossfadeEnabled = useCrossfadeStore(state => state.setEnabled);
    const syncCrossfade = useCrossfadeStore(state => state.syncFromEngine);

    const [isMobile, setIsMobile] = useState(layoutManager.mobile);
    const [isDragging, setIsDragging] = useState(false);
    const [localSeekValue, setLocalSeekValue] = useState(0);
    const [isVisible, setIsVisible] = useState(true);
    const [isLyricsActive, setIsLyricsActive] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const [showContextMenu, setShowContextMenu] = useState(false);
    const [isFavoritesLoading, setIsFavoritesLoading] = useState(false);
    const [bufferedRanges, setBufferedRanges] = useState<{ start: number; end: number }[]>([]);

    const supportedCommands = currentPlayer?.supportedCommands || [];
    const hasAirPlay = supportedCommands.includes('AirPlay');
    const hasRepeat = supportedCommands.includes('SetRepeatMode');
    const hasLyrics = currentItem
        ? (currentItem as PlayableItem & { hasLyrics?: boolean }).hasLyrics ||
          (currentItem as PlayableItem & { Type?: string }).Type === 'Audio'
        : false;

    useEffect(() => {
        const handleLayoutChange = () => {
            setIsMobile(layoutManager.mobile);
        };

        Events.on(layoutManager, 'modechange', handleLayoutChange);
        return () => {
            Events.off(layoutManager, 'modechange', handleLayoutChange);
        };
    }, []);

    useEffect(() => {
        const checkLyricsPage = () => {
            const path = window.location.hash;
            setIsLyricsActive(path.includes('lyrics'));
        };
        checkLyricsPage();
        Events.on(window, 'hashchange', checkLyricsPage);
        return () => Events.off(window, 'hashchange', checkLyricsPage);
    }, []);

    useEffect(() => {
        if (!isDragging) {
            setLocalSeekValue(currentTime);
        }
    }, [currentTime, isDragging]);

    useEffect(() => {
        const prevItemRef = { current: currentItem };

        if (currentItem && !prevItemRef.current) {
            Events.trigger(document, 'nowplayingbar:show');
        }

        prevItemRef.current = currentItem;
    }, [currentItem]);

    useEffect(() => {
        const handleViewBeforeShow = (e: Event) => {
            const detail = (e as CustomEvent<{ options?: { enableMediaControl?: boolean } }>).detail;
            if (!detail?.options?.enableMediaControl) {
                setIsVisible(false);
            } else {
                setIsVisible(true);
            }
        };

        document.addEventListener('viewbeforeshow', handleViewBeforeShow);

        const showNowPlayingBar = () => {
            setIsVisible(true);
        };

        Events.on(document, 'nowplayingbar:show', showNowPlayingBar);

        return () => {
            document.removeEventListener('viewbeforeshow', handleViewBeforeShow);
            Events.off(document, 'nowplayingbar:show', showNowPlayingBar);
        };
    }, []);

    useEffect(() => {
        if (currentItem) {
            setIsFavorite(currentItem.isFavorite || false);
        }
    }, [currentItem]);

    useEffect(() => {
        const unsub = useNotificationStore.subscribe(
            state => state.lastUserDataUpdate,
            update => {
                if (currentItem && update?.itemId === currentItem.id) {
                    setIsFavorite(update.isFavorite);
                }
            }
        );

        return unsub;
    }, [currentItem]);

    useEffect(() => {
        let intervalId: ReturnType<typeof setInterval> | null = null;

        const updateBufferedRanges = () => {
            if (currentItem && duration > 0) {
                const ranges = playbackManagerBridge.getBufferedRanges();
                const normalizedRanges = ranges.map(range => ({
                    start: (range.start / duration) * 100,
                    end: (range.end / duration) * 100
                }));
                setBufferedRanges(normalizedRanges);
            }
            syncCrossfade();
        };

        updateBufferedRanges();
        intervalId = setInterval(updateBufferedRanges, 500);

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [currentItem, currentTime, duration, syncCrossfade]);

    if (!currentItem || !isVisible) {
        return null;
    }

    const handlePlayPause = () => {
        togglePlayPause();
    };

    const handleStop = () => {
        stop();
    };

    const handlePrevious = () => {
        if (currentTime >= 5 || currentQueueIndex <= 0) {
            seek(0);
        } else {
            previous();
        }
    };

    const handleNext = () => {
        next();
    };

    const handleMuteToggle = () => {
        toggleMute();
    };

    const handleRepeatToggle = () => {
        toggleRepeatMode();
    };

    const handleShuffleToggle = () => {
        toggleShuffleMode();
    };

    const handleCrossfadeToggle = () => {
        setCrossfadeEnabled(!crossfadeEnabled);
    };

    const handleSeekStart = () => {
        setIsDragging(true);
    };

    const handleSeekChange = (_event: React.SyntheticEvent | Event, newValue: number | number[]) => {
        const value = Array.isArray(newValue) ? newValue[0] : newValue;
        setLocalSeekValue(value);
    };

    const handleSeekEnd = () => {
        setIsDragging(false);
        if (duration > 0) {
            const percent = (localSeekValue / duration) * 100;
            seekPercent(percent);
        }
    };

    const openNowPlaying = () => {
        appRouter.showNowPlaying();
    };

    const handleLyrics = () => {
        if (isLyricsActive) {
            appRouter.back();
        } else {
            appRouter.show('lyrics');
        }
    };

    const handleAirPlay = () => {
        if (currentPlayer && (currentPlayer as PlayerInfo & { toggleAirPlay?: () => void }).toggleAirPlay) {
            (currentPlayer as PlayerInfo & { toggleAirPlay: () => void }).toggleAirPlay();
        }
    };

    const handleFavorite = async () => {
        if (!currentItem || !currentItem.id || !currentItem.serverId || isFavoritesLoading) {
            return;
        }

        const newFavoriteState = !isFavorite;
        setIsFavoritesLoading(true);

        try {
            const apiClient = ServerConnections.getApiClient(currentItem.serverId);
            const userId = apiClient.getCurrentUserId();

            await apiClient.updateFavoriteStatus(userId, currentItem.id, newFavoriteState);

            setIsFavorite(newFavoriteState);
        } catch (error) {
            logger.error('Failed to update favorite status', { component: 'ReactNowPlayingBar' }, error as Error);
            setIsFavorite(!newFavoriteState);
        } finally {
            setIsFavoritesLoading(false);
        }
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        setShowContextMenu(!showContextMenu);
    };

    const getRepeatIconType = (): 'repeat' | 'repeat-one' => {
        return repeatMode === 'RepeatOne' ? 'repeat-one' : 'repeat';
    };

    const isRepeatActive = repeatMode !== 'RepeatNone';
    const isShuffleActive = shuffleMode === 'Shuffle';

    const trackName = currentItem.name || currentItem.title || 'Unknown Track';
    const artistName = currentItem.artist || currentItem.albumArtist || '';
    const imageUrl =
        currentItem.imageUrl ||
        currentItem.artwork?.find(img => img.type === 'Primary')?.url ||
        currentItem.artwork?.[0]?.url;

    const albumArtStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: vars.colors.surfaceVariant,
        width: '100%',
        height: '100%'
    };

    return (
        <AnimatePresence>
            <motion.div
                className="nowPlayingBar"
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                exit={{ y: 100 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
                <div className="nowPlayingBarTop">
                    <div id="barSurfer" className="nowPlayingBarPositionContainer sliderContainer">
                        <SeekSlider
                            currentTime={currentTime}
                            duration={duration || 100}
                            bufferedRanges={bufferedRanges}
                            onSeek={time => seekPercent((time / duration) * 100)}
                            onSeekStart={handleSeekStart}
                            onSeekEnd={handleSeekEnd}
                            waveSurferCompatible
                        />
                    </div>

                    <Flex
                        style={{
                            flexDirection: 'row',
                            gap: vars.spacing['5'],
                            alignItems: 'center',
                            cursor: 'pointer',
                            minWidth: 0,
                            flex: '0 1 auto'
                        }}
                        className="nowPlayingBarInfoContainer"
                        onClick={openNowPlaying}
                    >
                        <motion.div layoutId="now-playing-art">
                            <AspectRatio
                                ratio="1"
                                style={{
                                    width: 48,
                                    minWidth: 48,
                                    borderRadius: vars.borderRadius.sm,
                                    overflow: 'hidden',
                                    backgroundColor: vars.colors.backgroundAlt
                                }}
                            >
                                {imageUrl ? (
                                    <img src={imageUrl} alt={trackName} loading="lazy" style={{ objectFit: 'cover' }} />
                                ) : (
                                    <div style={albumArtStyle}>
                                        <DiscIcon
                                            data-testid="nowPlayingBarPlaceholderIcon"
                                            style={{
                                                fontSize: vars.typography['6'].fontSize,
                                                color: vars.colors.textSecondary
                                            }}
                                        />
                                    </div>
                                )}
                            </AspectRatio>
                        </motion.div>
                        <div className="nowPlayingBarText">
                            <Text
                                size="sm"
                                style={{
                                    fontWeight: vars.typography.fontWeightBold,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}
                            >
                                {trackName}
                            </Text>
                            <Text
                                size="xs"
                                style={{
                                    color: vars.colors.textMuted,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}
                            >
                                {artistName}
                            </Text>
                        </div>
                    </Flex>

                    <Flex
                        style={{
                            flexDirection: 'row',
                            gap: vars.spacing['2'],
                            alignItems: 'center'
                        }}
                        className="nowPlayingBarCenter"
                    >
                        <PlaybackIconButton icon="previous" onClick={handlePrevious} aria-label="Previous" />

                        <PlaybackIconButton
                            icon={isPlaying ? 'pause' : 'play'}
                            onClick={handlePlayPause}
                            size="md"
                            aria-label={isPlaying ? 'Pause' : 'Play'}
                        />

                        <PlaybackIconButton icon="stop" onClick={handleStop} aria-label="Stop" />

                        {!isMobile && <PlaybackIconButton icon="next" onClick={handleNext} aria-label="Next" />}

                        <Text size="xs" className="nowPlayingBarCurrentTime" style={{ marginLeft: vars.spacing['4'] }}>
                            {currentTimeFormatted}
                            {duration > 0 && ` / ${durationFormatted}`}
                        </Text>
                    </Flex>

                    <Flex
                        style={{
                            flexDirection: 'row',
                            gap: vars.spacing['2'],
                            alignItems: 'center'
                        }}
                        className="nowPlayingBarRight"
                    >
                        <VolumeSlider
                            volume={volume}
                            muted={muted}
                            onVolumeChange={setVolume}
                            onMuteToggle={toggleMute}
                        />

                        <PlaybackIconButton
                            icon="crossfade"
                            onClick={handleCrossfadeToggle}
                            active={crossfadeEnabled}
                            aria-label={crossfadeEnabled ? 'Disable crossfade' : 'Enable crossfade'}
                        />

                        <AnimatePresence>
                            {crossfadeEnabled && (
                                <motion.div
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 4 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Text
                                        size="xs"
                                        style={{
                                            color: crossfadeBusy ? vars.colors.primary : vars.colors.textSecondary,
                                            fontWeight: crossfadeBusy ? 600 : 500
                                        }}
                                    >
                                        XF {Math.round(crossfadeDuration)}s
                                    </Text>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {hasRepeat && (
                            <PlaybackIconButton
                                icon={getRepeatIconType()}
                                onClick={handleRepeatToggle}
                                active={isRepeatActive}
                                aria-label="Repeat"
                            />
                        )}

                        <PlaybackIconButton
                            icon="shuffle"
                            onClick={handleShuffleToggle}
                            active={isShuffleActive}
                            aria-label="Shuffle"
                        />

                        <AutoDJToggle />

                        {hasLyrics && (
                            <PlaybackIconButton
                                icon="lyrics"
                                onClick={handleLyrics}
                                active={isLyricsActive}
                                className="openLyricsButton"
                                aria-label="Lyrics"
                            />
                        )}

                        {hasAirPlay && (
                            <PlaybackIconButton
                                icon="airplay"
                                onClick={handleAirPlay}
                                className="btnAirPlay"
                                aria-label="AirPlay"
                            />
                        )}

                        <div className="nowPlayingBarUserDataButtons">
                            <PlaybackIconButton
                                icon={isFavorite ? 'favorite' : 'favorite-border'}
                                onClick={handleFavorite}
                                active={isFavorite}
                                className="emby-ratingbutton"
                                aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                            />
                        </div>

                        <PlaybackIconButton
                            icon="more-vert"
                            onClick={handleContextMenu}
                            className="btnToggleContextMenu"
                            aria-label="More options"
                        />

                        {isMobile && (
                            <>
                                <PlaybackIconButton
                                    icon={isPlaying ? 'pause' : 'play'}
                                    onClick={handlePlayPause}
                                    size="md"
                                    aria-label={isPlaying ? 'Pause' : 'Play'}
                                />
                                <PlaybackIconButton icon="next" onClick={handleNext} aria-label="Next" />
                            </>
                        )}
                    </Flex>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default NowPlayingBar;
