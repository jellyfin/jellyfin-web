import Button from '@mui/material/Button/Button';
import Dialog, { type DialogProps } from '@mui/material/Dialog/Dialog';
import DialogActions from '@mui/material/DialogActions/DialogActions';
import DialogContent from '@mui/material/DialogContent/DialogContent';
import DialogContentText from '@mui/material/DialogContentText/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle/DialogTitle';
import React, { type FC } from 'react';

import globalize from '@/lib/globalize';

interface ConfirmDialogProps extends DialogProps {
    confirmButtonColor?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning'
    confirmButtonText?: string
    title: string
    text: string
    onCancel: () => void
    onConfirm: () => void
}

/** Convenience wrapper for a simple MUI Dialog component for displaying a prompt that needs confirmation. */
const ConfirmDialog: FC<ConfirmDialogProps> = ({
    confirmButtonColor = 'primary',
    confirmButtonText,
    title,
    text,
    onCancel,
    onConfirm,
    ...dialogProps
}) => (
    <Dialog onClose={onCancel} {...dialogProps}>
        <DialogTitle>
            {title}
        </DialogTitle>
        <DialogContent>
            <DialogContentText sx={{ whiteSpace: 'pre-wrap' }}>
                {text}
            </DialogContentText>
        </DialogContent>
        <DialogActions>
            <Button
                variant='text'
                onClick={onCancel}
            >
                {globalize.translate('ButtonCancel')}
            </Button>
            <Button
                color={confirmButtonColor}
                onClick={onConfirm}
            >
                {confirmButtonText || globalize.translate('ButtonOk')}
            </Button>
        </DialogActions>
    </Dialog>
);

export default ConfirmDialog;
