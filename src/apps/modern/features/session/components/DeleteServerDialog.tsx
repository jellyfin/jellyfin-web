import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import React, { type FC, useId } from 'react';

import { VISUALLY_HIDDEN_STYLE } from 'apps/modern/utils/visuallyHidden';
import globalize from 'lib/globalize';

import type { AvailableServer } from '../api/useAvailableServers';
import { getServerDisplayName } from './ServerList';

interface DeleteServerDialogProps {
    server: AvailableServer
    /** Whether this is the server in use, which keeps working until the page is reloaded */
    isActive: boolean
    isDeleting: boolean
    /** Changes with every failure, so repeated failures are announced again. Undefined when nothing failed. */
    failureId?: number
    onConfirm: () => void
    onClose: () => void
}

const DeleteServerDialog: FC<DeleteServerDialogProps> = ({
    server,
    isActive,
    isDeleting,
    failureId,
    onConfirm,
    onClose
}) => {
    const confirmationId = useId();
    const warningId = useId();

    return (
        <Dialog
            open
            maxWidth='xs'
            fullWidth
            // The dialog stays open until the server is deleted
            onClose={isDeleting ? undefined : onClose}
            aria-describedby={isActive ? `${confirmationId} ${warningId}` : confirmationId}
        >
            <DialogTitle>{globalize.translate('DeleteName', getServerDisplayName(server))}</DialogTitle>
            <DialogContent>
                {/* The page behind the dialog is hidden from assistive technology, so the progress is announced here.
                    The region stays mounted, since a change of its text is announced more reliably than a region
                    that is added with its text */}
                <Box component='span' role='status' sx={VISUALLY_HIDDEN_STYLE}>
                    {isDeleting && globalize.translate('MessageDeletingServer', getServerDisplayName(server))}
                </Box>
                {failureId !== undefined && (
                    // Remount on every failure, so a repeated message is announced again
                    <Alert key={failureId} severity='error' sx={{ mb: 2 }}>
                        {globalize.translate('MessageServerDeleteFailed')}
                    </Alert>
                )}
                <DialogContentText id={confirmationId}>
                    {globalize.translate('DeleteServerConfirmation')}
                </DialogContentText>
                {isActive && (
                    <DialogContentText id={warningId} sx={{ mt: 2 }}>
                        {globalize.translate('MessageDeleteActiveServerWarning')}
                    </DialogContentText>
                )}
            </DialogContent>
            <DialogActions>
                <Button
                    variant='text'
                    // Deleting is destructive, so the dialog starts on the safe choice
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus
                    disabled={isDeleting}
                    onClick={onClose}
                >
                    {globalize.translate('ButtonCancel')}
                </Button>
                <Button
                    color='error'
                    // aria-disabled instead of disabled keeps the focus on the button while deleting, and after a
                    // failure. The disabled class gives it the disabled look that the disabled prop would.
                    aria-disabled={isDeleting || undefined}
                    className={isDeleting ? 'Mui-disabled' : undefined}
                    disableRipple={isDeleting}
                    startIcon={isDeleting ? <CircularProgress size={16} color='inherit' aria-hidden /> : undefined}
                    onClick={isDeleting ? undefined : onConfirm}
                >
                    {globalize.translate('Delete')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DeleteServerDialog;
