import React, { FC, useCallback, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Guide from 'components/guide/guide';
import 'material-design-icons-iconfont';
import 'elements/emby-programcell/emby-programcell';
import 'elements/emby-button/emby-button';
import 'elements/emby-button/paper-icon-button-light';
import 'elements/emby-tabs/emby-tabs';
import 'elements/emby-scroller/emby-scroller';
import 'components/guide/guide.scss';
import 'components/guide/programs.scss';
import 'styles/scrollstyles.scss';
import 'styles/flexstyles.scss';

const GuideView: FC = () => {
    const guideInstance = useRef<Guide | null>();
    const tvGuideContainerRef = useRef<HTMLDivElement>(null);

    const initGuide = useCallback((element: HTMLDivElement) => {
        guideInstance.current = new Guide({
            element: element,
            serverId: window.ApiClient.serverId()
        });
    }, []);

    useEffect(() => {
        const element = tvGuideContainerRef.current;
        if (!element) {
            console.error('Unexpected null reference');
            return;
        }
        if (!guideInstance.current) {
            initGuide(element);
        }
    }, [initGuide]);

    useEffect(() => {
        if (guideInstance.current) {
            guideInstance.current.resume();
        }

        return () => {
            if (guideInstance.current) {
                guideInstance.current.pause();
            }
        };
    }, [initGuide]);

    return <Box
        ref={tvGuideContainerRef}
        className='absolutePageTabContent'
        sx={{
            display: 'flex !important',
            width: 'auto',
            paddingTop: '0',
            paddingBottom: '0 !important',
            top: {
                xs: '6.9em !important',
                lg: '4em !important'
            }
        }}
    />;
};

export default GuideView;
