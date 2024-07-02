import React, { type FC, useCallback, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import { clearBackdrop } from 'components/backdrop/backdrop';
import HomeTab from 'controllers/hometab';
import Page from 'components/Page';

const Home: FC = () => {
    const homeInstance = useRef<HomeTab | null>();
    const elementRef = useRef<HTMLDivElement>(null);

    const initHomeTab = useCallback((element: HTMLDivElement) => {
        homeInstance.current = new HomeTab(element, null);
    }, []);

    useEffect(() => {
        const element = elementRef.current;
        if (!element) {
            console.error('Unexpected null reference');
            return;
        }
        if (!homeInstance.current) {
            initHomeTab(element);
        }
    }, [initHomeTab]);

    const onResume = useCallback(async () => {
        clearBackdrop();

        const currentTabController = homeInstance.current;

        if (currentTabController?.onResume) {
            await currentTabController.onResume({});
        }
    }, []);

    const onPause = useCallback(() => {
        const currentTabController = homeInstance.current;
        if (currentTabController?.onPause) {
            currentTabController.onPause();
        }
    }, []);

    useEffect(() => {
        void onResume();
        return () => {
            onPause();
        };
    }, [onPause, onResume]);

    return (
        <Page
            id='indexPage'
            className='mainAnimatedPage homePage libraryPage allLibraryPage backdropPage pageWithAbsoluteTabs withTabs'
            isBackButtonEnabled={false}
            backDropType='movie,series,book'
        >
            <Box ref={elementRef}>
                <Box className='sections' />
            </Box>
        </Page>
    );
};

export default Home;
