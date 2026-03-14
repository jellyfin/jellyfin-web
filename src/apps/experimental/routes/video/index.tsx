import Box from '@mui/material/Box/Box';
import Fade from '@mui/material/Fade/Fade';
import React, { useRef, type FC, useEffect, useState } from 'react';

import RemotePlayButton from 'apps/experimental/components/AppToolbar/RemotePlayButton';
import SyncPlayButton from 'apps/experimental/components/AppToolbar/SyncPlayButton';
import AppToolbar from 'components/toolbar/AppToolbar';
import ViewManagerPage from 'components/viewManager/ViewManagerPage';
import { EventType } from 'constants/eventType';
import Events, { type Event } from 'utils/events';
import Typography from '@mui/material/Typography';

/**
 * Video player page component that renders mui controls for the top controls and the legacy view for everything else.
 */
const VideoPage: FC = () => {
    const documentRef = useRef<Document>(document);
    const [ isVisible, setIsVisible ] = useState(true);
    const [ videoTitle, setVideoTitle ] = useState<string>('');

    const onShowVideoOsd = (_e: Event, isShowing: boolean) => {
        setIsVisible(isShowing);
    };

    const onTitleChange = (_e: Event, title: string) => {
        setVideoTitle(title);
    };

    useEffect(() => {
        const doc = documentRef.current;

        if (doc) {
            Events.on(doc, EventType.SHOW_VIDEO_OSD, onShowVideoOsd);
            Events.on(doc, EventType.VIDEO_TITLE_CHANGE, onTitleChange);
        }

        return () => {
            if (doc) {
                Events.off(doc, EventType.SHOW_VIDEO_OSD, onShowVideoOsd);
                Events.off(doc, EventType.VIDEO_TITLE_CHANGE, onTitleChange);
            }
        };
    }, []);

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
                    color: 'white'
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
                    >
                        <Typography>{videoTitle}</Typography>
                    </AppToolbar>
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
        </>
    );
};

export default VideoPage;
