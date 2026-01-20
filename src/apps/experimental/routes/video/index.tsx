import Box from '@mui/material/Box/Box';
import Fade from '@mui/material/Fade/Fade';
import React, { useRef, type FC, useEffect, useState, useCallback } from 'react';

import RemotePlayButton from 'apps/experimental/components/AppToolbar/RemotePlayButton';
import SyncPlayButton from 'apps/experimental/components/AppToolbar/SyncPlayButton';
import AppToolbar from 'components/toolbar/AppToolbar';
import ViewManagerPage from 'components/viewManager/ViewManagerPage';
import { EventType } from 'constants/eventType';
import Events, { type Event } from 'utils/events';
import { VideoControls } from 'components/joy-ui/playback/VideoControls';

/**
 * Video player page component that renders mui controls for the top controls and the legacy view for everything else.
 */
const VideoPage: FC = () => {
    const documentRef = useRef<Document>(document);
    const [ isVisible, setIsVisible ] = useState(true);

    const onShowVideoOsd = (_e: Event, isShowing: boolean) => {
        setIsVisible(isShowing);
    };

    useEffect(() => {
        const doc = documentRef.current;

        if (doc) Events.on(doc, EventType.SHOW_VIDEO_OSD, onShowVideoOsd);

        return () => {
            if (doc) Events.off(doc, EventType.SHOW_VIDEO_OSD, onShowVideoOsd);
        };
    }, []);

    const [ isPlaying, setIsPlaying ] = useState(false);
    const [ currentTime, setCurrentTime ] = useState(0);
    const [ duration, setDuration ] = useState(300);
    const [ volume, setVolume ] = useState(80);
    const [ isMuted, setIsMuted ] = useState(false);

    const handlePlayPause = useCallback(() => {
        setIsPlaying(!isPlaying);
    }, [isPlaying]);

    const handleSeek = useCallback((time: number) => {
        setCurrentTime(time);
    }, []);

    const handleSeekEnd = useCallback((time: number) => {
        setCurrentTime(time);
    }, []);

    const handleVolumeChange = useCallback((newVolume: number) => {
        setVolume(newVolume);
    }, []);

    const handleMuteToggle = useCallback(() => {
        setIsMuted(!isMuted);
    }, [isMuted]);

    const handleRewind = useCallback(() => {
        setCurrentTime(Math.max(0, currentTime - 10));
    }, [currentTime]);

    const handleFastForward = useCallback(() => {
        setCurrentTime(Math.min(duration, currentTime + 30));
    }, [currentTime, duration]);

    return (
        <>
            <Fade
                in={isVisible}
                easing='fade-out'
            >
                <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    color: 'white',
                    zIndex: 100
                }}>
                    <AppToolbar
                        isDrawerAvailable={false}
                        isDrawerOpen={false}
                        isBackButtonAvailable
                        isUserMenuAvailable={false}
                        buttons={
                            <>
                                <SyncPlayButton />
                                <RemotePlayButton />
                            </>
                        }
                    />
                </Box>
            </Fade>

            <ViewManagerPage
                controller='playback/video/index'
                view='playback/video/index.html'
                type='video-osd'
                isFullscreen
                isNowPlayingBarEnabled={false}
                isThemeMediaSupported
            />

            <VideoControls
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={duration}
                volume={volume}
                isMuted={isMuted}
                title='Sample Video'
                onPlayPause={handlePlayPause}
                onSeek={handleSeek}
                onSeekEnd={handleSeekEnd}
                onVolumeChange={handleVolumeChange}
                onMuteToggle={handleMuteToggle}
                onRewind={handleRewind}
                onFastForward={handleFastForward}
                onPreviousTrack={() => {}}
                onNextTrack={() => {}}
                onPreviousChapter={() => {}}
                onNextChapter={() => {}}
                onSubtitlesClick={() => {}}
                onAudioClick={() => {}}
                onSettingsClick={() => {}}
                onAirPlay={() => {}}
                onPiPClick={() => {}}
                onFullscreenClick={() => {}}
                onFavoriteClick={() => {}}
                onRecordClick={() => {}}
                isVisible={true}
                showOsd={isVisible}
            />
        </>
    );
};

export default VideoPage;
