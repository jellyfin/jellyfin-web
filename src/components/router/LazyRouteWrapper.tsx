import React, { Component, ReactNode, Suspense } from 'react';
import Box from '@mui/material/Box/Box';
import Typography from '@mui/material/Typography/Typography';
import CircularProgress from '@mui/material/CircularProgress/CircularProgress';

import { logger } from 'utils/logger';

/**
 * Loading fallback component for lazy-loaded routes
 */
const LoadingFallback: React.FC = () => (
    <Box
        display='flex'
        flexDirection='column'
        alignItems='center'
        justifyContent='center'
        minHeight='300px'
        p={3}
    >
        <CircularProgress size={48} sx={{ mb: 2 }} />
        <Typography variant='h6' color='text.secondary'>
            Loading...
        </Typography>
    </Box>
);

/**
 * Error boundary for lazy-loaded routes
 */
interface ErrorBoundaryState {
    hasError: boolean;
}

class LazyRouteErrorBoundary extends Component<
    { children: ReactNode; fallback?: ReactNode },
    ErrorBoundaryState
> {
    constructor(props: { children: ReactNode; fallback?: ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(): ErrorBoundaryState {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: any) {
        logger.errorFromCatch(error, {
            component: 'LazyRouteErrorBoundary',
            errorInfo
        });
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback || null;
        }

        return this.props.children;
    }
}

/**
 * Wrapper component that provides Suspense and Error boundaries for lazy routes
 * This ensures good UX during loading and error states
 */
interface LazyRouteWrapperProps {
    children: ReactNode;
    loadingFallback?: ReactNode;
    errorFallback?: ReactNode;
}

export const LazyRouteWrapper: React.FC<LazyRouteWrapperProps> = ({
    children,
    loadingFallback = <LoadingFallback />,
    errorFallback
}) => (
    <LazyRouteErrorBoundary fallback={errorFallback}>
        <Suspense fallback={loadingFallback}>
            {children}
        </Suspense>
    </LazyRouteErrorBoundary>
);

/**
 * Convenience wrapper for lazy-loaded routes with default UX
 */
export const withLazyRouteWrapper = (
    LazyComponent: React.LazyExoticComponent<React.ComponentType<any>>
) => () => (
    <LazyRouteWrapper>
        <LazyComponent />
    </LazyRouteWrapper>
);
