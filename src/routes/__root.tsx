import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import React, { lazy, Suspense } from 'react';
import { Box, Button, Text } from 'ui-primitives';
import Backdrop from '../components/Backdrop';
import CustomCss from '../components/CustomCss';
import { LoadingOverlay } from '../components/feedback';
import { LayoutProvider } from '../components/layout/LayoutProvider';
import { OSDOverlay } from '../components/playback';
import { ThemeProvider } from '../components/themeProvider/ThemeProvider';
import browser from '../scripts/browser';
import { queryClient } from '../utils/query/queryClient';

const Visualizers = lazy(() => import('../components/visualizer/Visualizers'));

const useReactQueryDevtools = typeof window.Proxy !== 'undefined' && !browser.tv;

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
    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                <Suspense fallback={null}>
                    <Visualizers />
                </Suspense>
                <Backdrop />

                <LayoutProvider>
                    <Outlet />
                </LayoutProvider>

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
