import CloseIcon from '@mui/icons-material/Close';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import React, { type FC } from 'react';

import globalize from 'lib/globalize';

import type { ConnectionProblem } from '../utils/connectionOutcome';
import ServerUpdateNeededAlert from './ServerUpdateNeededAlert';

export interface ConnectionProblemAlertProps {
    problem: ConnectionProblem
    onClose?: () => void
    /** Shows a retry button for a server that is unavailable */
    onRetry?: () => void
}

const ConnectionProblemAlert: FC<ConnectionProblemAlertProps> = ({ problem, onClose, onRetry }) => {
    if (problem.kind === 'updateNeeded') return <ServerUpdateNeededAlert onClose={onClose} />;

    return (
        <Alert
            severity='error'
            // A custom action replaces the close button of the alert, so it is added again next to the retry button
            onClose={onRetry ? undefined : onClose}
            closeText={globalize.translate('ButtonClose')}
            action={onRetry && (
                <>
                    <Button color='inherit' size='small' onClick={onRetry}>
                        {globalize.translate('Retry')}
                    </Button>
                    {onClose && (
                        <IconButton
                            color='inherit'
                            size='small'
                            aria-label={globalize.translate('ButtonClose')}
                            title={globalize.translate('ButtonClose')}
                            onClick={onClose}
                        >
                            <CloseIcon fontSize='small' aria-hidden />
                        </IconButton>
                    )}
                </>
            )}
        >
            <AlertTitle>{globalize.translate('HeaderConnectionFailure')}</AlertTitle>
            {globalize.translate('MessageServerConnectionFailed')}
        </Alert>
    );
};

export default ConnectionProblemAlert;
