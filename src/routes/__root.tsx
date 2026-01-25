import React, { lazy, Suspense } from 'react';
import { createRootRoute, Outlet, useLocation } from '@tanstack/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from '../components/themeProvider/ThemeProvider';
import browser from '../scripts/browser';
import { queryClient } from '../utils/query/queryClient';
import { OSDOverlay } from '../components/joy-ui/playback';
import { LoadingOverlay } from '../components/joy-ui/feedback';
import AppBody from '../components/AppBody';
import CustomCss from '../components/CustomCss';
import Backdrop from '../components/Backdrop';
import AppHeader from '../components/AppHeader';
import { DASHBOARD_APP_PATHS } from '../apps/dashboard/routes/routes';
import { LayoutMode } from '../constants/layoutMode';
import { Box, Text, Button } from 'ui-primitives';

const Visualizers = lazy(() => import('../components/visualizer/Visualizers'));

const useReactQueryDevtools = typeof window.Proxy !== 'undefined' && !browser.tv;
const LAYOUT_SETTING_KEY = 'layout';

const handleGoHome = () => {
    window.location.href = '/';
};

function NotFoundPage() {
    return (
        <Box
            style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24
            }}
        >
            <Text as="h1" size="xl" weight="bold" style={{ marginBottom: 16 }}>
                Page Not Found
            </Text>
            <Text size="md" color="secondary" style={{ marginBottom: 24 }}>
                The requested page could not be found.
            </Text>
            <Button variant="primary" onClick={handleGoHome}>
                Go Home
            </Button>
        </Box>
    );
}

function RootComponent() {
    const location = useLocation();

    const layoutMode = browser.tv ? LayoutMode.Tv : localStorage.getItem(LAYOUT_SETTING_KEY);
    const isExperimentalLayout = layoutMode == null || layoutMode === '' || layoutMode === LayoutMode.Experimental;
    const isNewLayoutPath = Object.values(DASHBOARD_APP_PATHS).some(path => location.pathname.startsWith(`/${path}`));

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                <Suspense fallback={null}>
                    <Visualizers />
                </Suspense>
                <Backdrop />
                <AppHeader isHidden={isExperimentalLayout || isNewLayoutPath} />

                <AppBody>
                    <Outlet />
                </AppBody>

                <CustomCss />
                <OSDOverlay />
                <LoadingOverlay />
            </ThemeProvider>
            {useReactQueryDevtools && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
    );
}

export const Route = createRootRoute({
    notFoundComponent: NotFoundPage,
    component: RootComponent
});
