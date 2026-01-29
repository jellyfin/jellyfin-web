import type { ErrorComponentProps } from '@tanstack/react-router';
import loading from 'components/loading/loading';
import { useEffect } from 'react';
import { logger } from 'utils/logger';

const ErrorBoundary = ({ error }: ErrorComponentProps) => {
    const normalizedError = error instanceof Error ? error : new Error('Unknown route error');

    useEffect(() => {
        loading.hide();
    }, []);

    useEffect(() => {
        if (!error) {
            return;
        }

        logger.errorFromCatch(normalizedError, {
            component: 'ErrorBoundary',
            type: 'route-error'
        });
    }, [error, normalizedError]);

    return null;
};

export default ErrorBoundary;
