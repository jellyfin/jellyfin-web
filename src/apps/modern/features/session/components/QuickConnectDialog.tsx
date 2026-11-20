import type { Api } from '@jellyfin/sdk/lib/api';
import type { AuthenticationResult } from '@jellyfin/sdk/lib/generated-client/models/authentication-result';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import React, { type FC, useCallback, useEffect, useId, useRef } from 'react';

import { VISUALLY_HIDDEN_STYLE } from 'apps/modern/utils/visuallyHidden';
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
    const helpId = useId();
    const codeId = useId();
    const statusId = useId();

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

    const onCancelClick = useCallback(() => {
        if (!isAuthorized) onClose();
    }, [ isAuthorized, onClose ]);

    return (
        <Dialog
            open
            maxWidth='xs'
            fullWidth
            // Once authorized, the login can no longer be cancelled
            onClose={isAuthorized ? undefined : onClose}
            // The dialog has no focusable content besides the cancel button, so it is described by its content
            aria-describedby={`${helpId} ${codeId} ${statusId}`}
        >
            <DialogTitle>{globalize.translate('QuickConnect')}</DialogTitle>
            <DialogContent>
                <Stack spacing={2} alignItems='center'>
                    <DialogContentText id={helpId}>
                        {globalize.translate('QuickConnectCodeHelp')}
                    </DialogContentText>
                    <Typography
                        id={codeId}
                        variant='h3'
                        component='p'
                        sx={{ fontSize: '2.25rem', letterSpacing: '0.2em', fontVariantNumeric: 'tabular-nums' }}
                    >
                        {/* Screen readers get the code digit by digit instead of as a number */}
                        <span aria-hidden>{code}</span>
                        <Box component='span' sx={VISUALLY_HIDDEN_STYLE}>
                            {globalize.translate('QuickConnectCodeSpoken', code.split('').join(' '))}
                        </Box>
                    </Typography>
                    <Stack direction='row' spacing={1.5} alignItems='center'>
                        <CircularProgress size={20} aria-hidden />
                        {/* The status region is always mounted, so the change to approved is announced */}
                        <Typography id={statusId} variant='body2' color='text.secondary' role='status'>
                            {globalize.translate(isAuthorized ? 'QuickConnectApproved' : 'QuickConnectWaitingForApproval')}
                        </Typography>
                    </Stack>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button
                    // aria-disabled instead of disabled keeps the focus inside the dialog once authorized.
                    // The disabled class gives it the disabled look that the disabled prop would.
                    aria-disabled={isAuthorized || undefined}
                    className={isAuthorized ? 'Mui-disabled' : undefined}
                    disableRipple={!!isAuthorized}
                    onClick={onCancelClick}
                >
                    {globalize.translate('ButtonCancel')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default QuickConnectDialog;
