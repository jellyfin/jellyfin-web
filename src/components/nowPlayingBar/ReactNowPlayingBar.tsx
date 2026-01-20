import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./nowPlayingBar.scss";
import Stack from "@mui/joy/Stack";
import Typography from "@mui/joy/Typography";
import AspectRatio from "@mui/joy/AspectRatio";
import MusicNoteIcon from "@mui/icons-material/MusicNote";

import {
    PlaybackIconButton,
    PlaybackSlider,
    VolumeSlider,
    AutoDJToggle
} from "../joy-ui/playback";

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
    useProgress
} from "../../store";
import type { PlayableItem, PlayerInfo } from "../../store/types";

import layoutManager from "../layoutManager";
import Events from "../../utils/events";
import { appRouter } from "../router/appRouter";
import { ServerConnections } from "lib/jellyfin-apiclient";
import serverNotifications from "../../scripts/serverNotifications";
import { playbackManagerBridge } from "../../store/playbackManagerBridge";
import { logger } from "../../utils/logger";

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

    const progress = useProgress();

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
    const hasAirPlay = supportedCommands.includes("AirPlay");
    const hasRepeat = supportedCommands.includes("SetRepeatMode");
    const hasLyrics = currentItem ? ((currentItem as PlayableItem & { hasLyrics?: boolean }).hasLyrics ||
        (currentItem as PlayableItem & { Type?: string }).Type === "Audio") : false;

    useEffect(() => {
        const handleLayoutChange = () => {
            setIsMobile(layoutManager.mobile);
        };

        Events.on(layoutManager, "modechange", handleLayoutChange);
        return () => {
            Events.off(layoutManager, "modechange", handleLayoutChange);
        };
    }, []);

    useEffect(() => {
        const checkLyricsPage = () => {
            const path = window.location.hash;
            setIsLyricsActive(path.includes("lyrics"));
        };
        checkLyricsPage();
        Events.on(window, "hashchange", checkLyricsPage);
        return () => Events.off(window, "hashchange", checkLyricsPage);
    }, []);

    useEffect(() => {
        if (!isDragging) {
            setLocalSeekValue(currentTime);
        }
    }, [currentTime, isDragging]);

    useEffect(() => {
        const prevItemRef = { current: currentItem };

        if (currentItem && !prevItemRef.current) {
            Events.trigger(document, "nowplayingbar:show");
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

        document.addEventListener("viewbeforeshow", handleViewBeforeShow);

        const showNowPlayingBar = () => {
            setIsVisible(true);
        };

        Events.on(document, "nowplayingbar:show", showNowPlayingBar);

        return () => {
            document.removeEventListener("viewbeforeshow", handleViewBeforeShow);
            Events.off(document, "nowplayingbar:show", showNowPlayingBar);
        };
    }, []);

    useEffect(() => {
        if (currentItem) {
            setIsFavorite(currentItem.isFavorite || false);
        }
    }, [currentItem]);

    useEffect(() => {
        const handleUserDataChanged = (_e: unknown, _apiClient: unknown, userData: { ItemId: string; IsFavorite: boolean }) => {
            if (currentItem && userData.ItemId === currentItem.id) {
                setIsFavorite(userData.IsFavorite);
            }
        };

        Events.on(serverNotifications, "UserDataChanged", handleUserDataChanged);

        return () => {
            Events.off(serverNotifications, "UserDataChanged", handleUserDataChanged);
        };
    }, [currentItem]);

    useEffect(() => {
        let intervalId: ReturnType<typeof setInterval> | null = null;

        const updateBufferedRanges = () => {
            if (currentItem && duration > 0) {
                const ranges = playbackManagerBridge.getBufferedRanges();
                const progressPercent = (currentTime / duration) * 100;
                const normalizedRanges = ranges.map(range => ({
                    start: (range.start / duration) * 100,
                    end: (range.end / duration) * 100
                }));
                setBufferedRanges(normalizedRanges);
            }
        };

        updateBufferedRanges();
        intervalId = setInterval(updateBufferedRanges, 500);

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [currentItem, currentTime, duration]);

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

    const handleVolumeChange = (_event: React.SyntheticEvent | Event, newValue: number | number[]) => {
        const newVolume = Array.isArray(newValue) ? newValue[0] : newValue;
        setVolume(newVolume);
    };

    const handleRepeatToggle = () => {
        toggleRepeatMode();
    };

    const handleShuffleToggle = () => {
        toggleShuffleMode();
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
            appRouter.show("lyrics");
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
            logger.error("Failed to update favorite status", { component: "ReactNowPlayingBar" }, error as Error);
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
        return repeatMode === "RepeatOne" ? 'repeat-one' : 'repeat';
    };

    const isRepeatActive = repeatMode !== "RepeatNone";
    const isShuffleActive = shuffleMode === "Shuffle";

    const trackName = currentItem.name || currentItem.title || "Unknown Track";
    const artistName = currentItem.artist || currentItem.albumArtist || "";
    const imageUrl = currentItem.imageUrl
        || currentItem.artwork?.find(img => img.type === "Primary")?.url
        || currentItem.artwork?.[0]?.url;

    const albumArtStyle: React.CSSProperties = {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--joy-palette-neutral-700, #303030)",
        width: "100%",
        height: "100%",
    };

    return (
        <AnimatePresence>
            <motion.div
                className="nowPlayingBar"
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                exit={{ y: 100 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
                <div className="nowPlayingBarTop">
                    <div id="barSurfer" className="nowPlayingBarPositionContainer sliderContainer">
                        <PlaybackSlider
                            value={localSeekValue}
                            max={duration || 100}
                            bufferedRanges={bufferedRanges}
                            onChange={handleSeekChange}
                            onChangeCommitted={handleSeekEnd}
                            waveSurferCompatible
                        />
                    </div>

                    <Stack
                        direction="row"
                        spacing={1.5}
                        alignItems="center"
                        className="nowPlayingBarInfoContainer"
                        onClick={openNowPlaying}
                        sx={{ cursor: "pointer", minWidth: 0, flex: "0 1 auto" }}
                    >
                        <motion.div layoutId="now-playing-art">
                            <AspectRatio
                                ratio="1"
                                sx={{
                                    width: 48,
                                    minWidth: 48,
                                    borderRadius: "sm",
                                    overflow: "hidden",
                                    bgcolor: "neutral.800",
                                }}
                            >
                                {imageUrl ? (
                                    <img
                                        src={imageUrl}
                                        alt={trackName}
                                        loading="lazy"
                                        style={{ objectFit: "cover" }}
                                    />
                                ) : (
                                    <div style={albumArtStyle}>
                                        <MusicNoteIcon sx={{ fontSize: 24, color: "neutral.400" }} />
                                    </div>
                                )}
                            </AspectRatio>
                        </motion.div>
                        <div className="nowPlayingBarText">
                            <Typography
                                level="body-sm"
                                sx={{
                                    fontWeight: "bold",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                }}
                            >
                                {trackName}
                            </Typography>
                            <Typography
                                level="body-xs"
                                sx={{
                                    color: "neutral.400",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                }}
                            >
                                {artistName}
                            </Typography>
                        </div>
                    </Stack>

                    <Stack direction="row" spacing={0.5} alignItems="center" className="nowPlayingBarCenter">
                        <PlaybackIconButton
                            icon="previous"
                            onClick={handlePrevious}
                            aria-label="Previous"
                        />

                        <PlaybackIconButton
                            icon={isPlaying ? "pause" : "play"}
                            onClick={handlePlayPause}
                            size="md"
                            aria-label={isPlaying ? "Pause" : "Play"}
                        />

                        <PlaybackIconButton
                            icon="stop"
                            onClick={handleStop}
                            aria-label="Stop"
                        />

                        {!isMobile && (
                            <PlaybackIconButton
                                icon="next"
                                onClick={handleNext}
                                aria-label="Next"
                            />
                        )}

                        <Typography level="body-xs" className="nowPlayingBarCurrentTime" sx={{ ml: 1 }}>
                            {currentTimeFormatted}
                            {duration > 0 && ` / ${durationFormatted}`}
                        </Typography>
                    </Stack>

                    <Stack direction="row" spacing={0.5} alignItems="center" className="nowPlayingBarRight">
                        <VolumeSlider
                            volume={volume}
                            muted={muted}
                            onVolumeChange={setVolume}
                            onMuteToggle={toggleMute}
                        />

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
                                icon={isFavorite ? "favorite" : "favorite-border"}
                                onClick={handleFavorite}
                                active={isFavorite}
                                className="emby-ratingbutton"
                                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
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
                                    icon={isPlaying ? "pause" : "play"}
                                    onClick={handlePlayPause}
                                    size="md"
                                    aria-label={isPlaying ? "Pause" : "Play"}
                                />
                                <PlaybackIconButton
                                    icon="next"
                                    onClick={handleNext}
                                    aria-label="Next"
                                />
                            </>
                        )}
                    </Stack>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default NowPlayingBar;
