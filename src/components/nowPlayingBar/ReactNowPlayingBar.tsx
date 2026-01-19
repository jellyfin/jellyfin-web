import React, { useEffect, useState, useCallback, useRef } from "react";
import { useAudioStore } from "../../store/audioStore";
import { motion, AnimatePresence } from "framer-motion";
import "./nowPlayingBar.scss";
import IconButton from "@mui/material/IconButton/IconButton";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import StopIcon from "@mui/icons-material/Stop";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import RepeatIcon from "@mui/icons-material/Repeat";
import RepeatOneIcon from "@mui/icons-material/RepeatOne";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import { playbackManager } from "../playback/playbackmanager";
import layoutManager from "../layoutManager";
import datetime from "../../scripts/datetime";
import Events from "../../utils/events";
import { appRouter } from "../router/appRouter";

type RepeatMode = "RepeatNone" | "RepeatAll" | "RepeatOne";
type ShuffleMode = "Sorted" | "Shuffle";

export const NowPlayingBar: React.FC = () => {
    const {
        currentTrack,
        isPlaying,
        setIsPlaying,
        currentTime,
        duration,
        volume,
        setVolume,
        muted,
        setMuted,
    } = useAudioStore();

    const [repeatMode, setRepeatMode] = useState<RepeatMode>("RepeatNone");
    const [shuffleMode, setShuffleMode] = useState<ShuffleMode>("Sorted");
    const [isMobile, setIsMobile] = useState(layoutManager.mobile);
    const [isDragging, setIsDragging] = useState(false);
    const [localSeekValue, setLocalSeekValue] = useState(0);
    const positionSliderRef = useRef<HTMLInputElement>(null);

    // Get current player
    const getCurrentPlayer = useCallback(() => {
        return (playbackManager as any).getCurrentPlayer?.() || null;
    }, []);

    // Sync with playbackManager state
    useEffect(() => {
        const syncState = () => {
            const mode = playbackManager.getRepeatMode();
            setRepeatMode(mode as RepeatMode);

            const shuffle = (playbackManager as any).getQueueShuffleMode?.();
            setShuffleMode(shuffle === "Shuffle" ? "Shuffle" : "Sorted");
        };

        const handleLayoutChange = () => {
            setIsMobile(layoutManager.mobile);
        };

        syncState();

        Events.on(playbackManager, "repeatmodechange", syncState);
        Events.on(playbackManager, "shufflequeuemodechange", syncState);
        Events.on(layoutManager, "modechange", handleLayoutChange);

        return () => {
            Events.off(playbackManager, "repeatmodechange", syncState);
            Events.off(playbackManager, "shufflequeuemodechange", syncState);
            Events.off(layoutManager, "modechange", handleLayoutChange);
        };
    }, []);

    // Update local seek value when not dragging
    useEffect(() => {
        if (!isDragging) {
            setLocalSeekValue(currentTime);
        }
    }, [currentTime, isDragging]);

    if (!currentTrack) {
        return null;
    }

    const handlePlayPause = () => {
        const player = getCurrentPlayer();
        if (player) {
            playbackManager.playPause(player);
        }
        setIsPlaying(!isPlaying);
    };

    const handleStop = () => {
        const player = getCurrentPlayer();
        if (player) {
            playbackManager.stop(player);
        }
    };

    const handlePrevious = () => {
        const player = getCurrentPlayer();
        if (player) {
            // If we're more than 5 seconds in, restart the track
            // Otherwise go to previous track
            if (currentTime >= 5) {
                playbackManager.seekPercent(0, player);
            } else {
                playbackManager.previousTrack(player);
            }
        }
    };

    const handleNext = () => {
        const player = getCurrentPlayer();
        if (player) {
            playbackManager.nextTrack(player);
        }
    };

    const handleMuteToggle = () => {
        const player = getCurrentPlayer();
        if (player) {
            playbackManager.toggleMute(player);
        }
        setMuted(!muted);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = Number(e.target.value);
        setVolume(newVolume);
        const player = getCurrentPlayer();
        if (player && (player as any).setVolume) {
            (player as any).setVolume(newVolume);
        }
    };

    const handleRepeatToggle = () => {
        let newMode: RepeatMode;
        switch (repeatMode) {
            case "RepeatNone":
                newMode = "RepeatAll";
                break;
            case "RepeatAll":
                newMode = "RepeatOne";
                break;
            case "RepeatOne":
            default:
                newMode = "RepeatNone";
                break;
        }
        playbackManager.setRepeatMode(newMode);
        setRepeatMode(newMode);
    };

    const handleShuffleToggle = () => {
        (playbackManager as any).toggleQueueShuffleMode?.();
        setShuffleMode(shuffleMode === "Shuffle" ? "Sorted" : "Shuffle");
    };

    const handleSeekStart = () => {
        setIsDragging(true);
    };

    const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = Number(e.target.value);
        setLocalSeekValue(value);
    };

    const handleSeekEnd = () => {
        setIsDragging(false);
        const player = getCurrentPlayer();
        if (player && duration > 0) {
            const percent = (localSeekValue / duration) * 100;
            playbackManager.seekPercent(percent, player);
        }
    };

    const openNowPlaying = () => {
        appRouter.showNowPlaying();
    };

    const formatTime = (seconds: number): string => {
        if (!seconds || seconds < 0) return "--:--";
        // Convert to ticks for datetime helper (ticks = seconds * 10000000)
        const ticks = seconds * 10000000;
        return datetime.getDisplayRunningTime(ticks);
    };

    const getRepeatIcon = () => {
        if (repeatMode === "RepeatOne") {
            return <RepeatOneIcon />;
        }
        return <RepeatIcon />;
    };

    const isRepeatActive = repeatMode !== "RepeatNone";
    const isShuffleActive = shuffleMode === "Shuffle";
    const progressPercent = duration > 0 ? (localSeekValue / duration) * 100 : 0;

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
                    {/* Position Slider - above the bar */}
                    <div className="nowPlayingBarPositionContainer sliderContainer">
                        <input
                            ref={positionSliderRef}
                            type="range"
                            className="slider-medium-thumb nowPlayingBarPositionSlider"
                            min={0}
                            max={duration || 100}
                            step={0.1}
                            value={localSeekValue}
                            onMouseDown={handleSeekStart}
                            onTouchStart={handleSeekStart}
                            onChange={handleSeekChange}
                            onMouseUp={handleSeekEnd}
                            onTouchEnd={handleSeekEnd}
                            style={{
                                backgroundSize: `${progressPercent}% 100%`,
                            }}
                        />
                    </div>

                    {/* Track Info - Left Section */}
                    <div
                        className="nowPlayingBarInfoContainer"
                        onClick={openNowPlaying}
                        style={{ cursor: "pointer" }}
                    >
                        <motion.div
                            layoutId="now-playing-art"
                            className="nowPlayingImage"
                            style={{
                                backgroundImage: currentTrack.imageUrl
                                    ? `url(${currentTrack.imageUrl})`
                                    : "none",
                                backgroundSize: "cover",
                            }}
                        />
                        <div className="nowPlayingBarText">
                            <div className="nowPlayingBarTitle">
                                {currentTrack.name}
                            </div>
                            <div className="nowPlayingBarSecondaryText">
                                {currentTrack.artist}
                            </div>
                        </div>
                    </div>

                    {/* Center Controls */}
                    <div className="nowPlayingBarCenter">
                        <IconButton
                            onClick={handlePrevious}
                            className="previousTrackButton mediaButton"
                            size="small"
                            sx={{ color: "var(--theme-text-color, white)" }}
                            title="Previous"
                        >
                            <SkipPreviousIcon />
                        </IconButton>

                        <IconButton
                            onClick={handlePlayPause}
                            className="playPauseButton mediaButton"
                            size="medium"
                            sx={{ color: "var(--theme-text-color, white)" }}
                            title={isPlaying ? "Pause" : "Play"}
                        >
                            {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                        </IconButton>

                        <IconButton
                            onClick={handleStop}
                            className="stopButton mediaButton"
                            size="small"
                            sx={{ color: "var(--theme-text-color, white)" }}
                            title="Stop"
                        >
                            <StopIcon />
                        </IconButton>

                        {!isMobile && (
                            <IconButton
                                onClick={handleNext}
                                className="nextTrackButton mediaButton"
                                size="small"
                                sx={{ color: "var(--theme-text-color, white)" }}
                                title="Next"
                            >
                                <SkipNextIcon />
                            </IconButton>
                        )}

                        <div className="nowPlayingBarCurrentTime">
                            {formatTime(currentTime)}
                            {duration > 0 && ` / ${formatTime(duration)}`}
                        </div>
                    </div>

                    {/* Right Controls */}
                    <div className="nowPlayingBarRight">
                        <IconButton
                            onClick={handleMuteToggle}
                            className="muteButton mediaButton"
                            size="small"
                            sx={{ color: "var(--theme-text-color, white)" }}
                            title={muted ? "Unmute" : "Mute"}
                        >
                            {muted ? <VolumeOffIcon /> : <VolumeUpIcon />}
                        </IconButton>

                        <div className="nowPlayingBarVolumeSliderContainer sliderContainer">
                            <input
                                type="range"
                                className="slider-medium-thumb nowPlayingBarVolumeSlider"
                                min={0}
                                max={100}
                                value={muted ? 0 : volume}
                                onChange={handleVolumeChange}
                                style={{ backgroundSize: `${muted ? 0 : volume}% 100%` }}
                            />
                        </div>

                        <IconButton
                            onClick={handleRepeatToggle}
                            className={`toggleRepeatButton mediaButton ${isRepeatActive ? "buttonActive" : ""}`}
                            size="small"
                            sx={{
                                color: isRepeatActive
                                    ? "var(--theme-primary-color, #00a4dc)"
                                    : "var(--theme-text-color, white)",
                            }}
                            title="Repeat"
                        >
                            {getRepeatIcon()}
                        </IconButton>

                        <IconButton
                            onClick={handleShuffleToggle}
                            className={`btnShuffleQueue mediaButton ${isShuffleActive ? "buttonActive" : ""}`}
                            size="small"
                            sx={{
                                color: isShuffleActive
                                    ? "var(--theme-primary-color, #00a4dc)"
                                    : "var(--theme-text-color, white)",
                            }}
                            title="Shuffle"
                        >
                            <ShuffleIcon />
                        </IconButton>

                        {/* Mobile-specific controls: play/pause and next in right section */}
                        {isMobile && (
                            <>
                                <IconButton
                                    onClick={handlePlayPause}
                                    className="playPauseButton mediaButton"
                                    size="medium"
                                    sx={{ color: "var(--theme-text-color, white)" }}
                                >
                                    {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                                </IconButton>
                                <IconButton
                                    onClick={handleNext}
                                    className="nextTrackButton mediaButton"
                                    size="small"
                                    sx={{ color: "var(--theme-text-color, white)" }}
                                >
                                    <SkipNextIcon />
                                </IconButton>
                            </>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
