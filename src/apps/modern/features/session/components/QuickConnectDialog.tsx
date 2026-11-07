import type { Api } from '@jellyfin/sdk/lib/api';
import type { AuthenticationResult } from '@jellyfin/sdk/lib/generated-client/models/authentication-result';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import React, { type FC, useEffect, useRef } from 'react';

import globalize from 'lib/globalize';

import { useAuthenticateWithQuickConnect, useQuickConnectState } from '../api/useQuickConnect';

interface QuickConnectDialogProps {
    api: Api
    code: string
    secret: string
    onAuthenticated: (result: AuthenticationResult) => void
    onClose: () => void
    onError: (error: Error) => void
}

const QuickConnectDialog: FC<QuickConnectDialogProps> = ({
    api,
    code,
    secret,
    onAuthenticated,
    onClose,
    onError
}) => {
    const { data: isAuthorized, error: stateError } = useQuickConnectState(api, secret);
    const {
        data: result,
        error: authenticationError,
        mutate: authenticate
    } = useAuthenticateWithQuickConnect(api);
    const isAuthenticationStartedRef = useRef(false);
    const isAuthenticatedHandledRef = useRef(false);

    useEffect(() => {
        // Only exchange the secret once, even if the effect runs again
        if (isAuthorized && !isAuthenticationStartedRef.current) {
            isAuthenticationStartedRef.current = true;
            authenticate(secret);
        }
    }, [ authenticate, isAuthorized, secret ]);

    useEffect(() => {
        // Only complete the login once, even if the callback changes
        if (result && !isAuthenticatedHandledRef.current) {
            isAuthenticatedHandledRef.current = true;
            onAuthenticated(result);
        }
    }, [ result, onAuthenticated ]);

    useEffect(() => {
        const error = stateError ?? authenticationError;
        if (error) onError(error);
    }, [ stateError, authenticationError, onError ]);

    return (
        <Dialog
            open
            maxWidth='xs'
            fullWidth
            // Once authorized, the login can no longer be cancelled
            onClose={isAuthorized ? undefined : onClose}
        >
            <DialogTitle>{globalize.translate('QuickConnect')}</DialogTitle>
            <DialogContent>
                <Stack spacing={2} alignItems='center'>
                    <DialogContentText>
                        {globalize.translate('QuickConnectAuthorizeCode', code)}
                    </DialogContentText>
                    <CircularProgress aria-hidden />
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button disabled={isAuthorized} onClick={onClose}>
                    {globalize.translate('ButtonCancel')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default QuickConnectDialog;
