import React, { Component, ReactNode, Suspense } from 'react';
import Box from '@mui/material/Box/Box';
import Typography from '@mui/material/Typography/Typography';
import CircularProgress from '@mui/material/CircularProgress/CircularProgress';
import Button from '@mui/material/Button/Button';
import Alert from '@mui/material/Alert/Alert';
import AlertTitle from '@mui/material/AlertTitle/AlertTitle';

/**
 * Loading fallback component for lazy-loaded routes
 */
const LoadingFallback: React.FC = () => (
    <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="300px"
        p={3}
    >
        <CircularProgress size={48} sx={{ mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
            Loading...
        </Typography>
    </Box>
);

/**
 * Error boundary for lazy-loaded routes
 */
interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

class LazyRouteErrorBoundary extends Component<
    { children: ReactNode; fallback?: ReactNode },
    ErrorBoundaryState
> {
    constructor(props: { children: ReactNode; fallback?: ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: any) {
        console.error('Lazy route error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <Box p={3}>
                    <Alert severity="error">
                        <AlertTitle>Failed to load page</AlertTitle>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            There was an error loading this page. Please try refreshing.
                        </Typography>
                        <Button
                            variant="outlined"
                            size="small"
                            sx={{ mt: 2 }}
                            onClick={() => window.location.reload()}
                        >
                            Refresh Page
                        </Button>
                    </Alert>
                </Box>
            );
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