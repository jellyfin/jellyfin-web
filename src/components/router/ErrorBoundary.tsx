import { useEffect } from 'react';
import { useRouteError } from 'react-router-dom';

import { logger } from 'utils/logger';
import loading from 'components/loading/loading';

const ErrorBoundary = () => {
    const error = useRouteError() as Error;

    useEffect(() => {
        loading.hide();
    }, []);

    useEffect(() => {
        logger.errorFromCatch(error, {
            component: 'ErrorBoundary',
            type: 'route-error'
        });
    }, [error]);

    return null;
};

export default ErrorBoundary;
