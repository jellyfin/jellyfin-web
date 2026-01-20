import Button from '@mui/joy/Button';
import Modal from '@mui/joy/Modal';
import ModalDialog from '@mui/joy/ModalDialog';
import DialogTitle from '@mui/joy/DialogTitle';
import DialogContent from '@mui/joy/DialogContent';
import DialogActions from '@mui/joy/DialogActions';
import React, { type FC } from 'react';

import globalize from 'lib/globalize';

interface ConfirmDialogProps {
    open: boolean;
    confirmButtonColor?: 'primary' | 'danger' | 'neutral' | 'success' | 'warning';
    confirmButtonText?: string;
    title: string;
    text: string;
    onCancel: () => void;
    onConfirm: () => void;
}

/** Convenience wrapper for a simple Joy UI Dialog component for displaying a prompt that needs confirmation. */
const ConfirmDialog: FC<ConfirmDialogProps> = ({
    open,
    confirmButtonColor = 'primary',
    confirmButtonText,
    title,
    text,
    onCancel,
    onConfirm
}) => (
    <Modal open={open} onClose={onCancel}>
        <ModalDialog variant="outlined" role="alertdialog">
            <DialogTitle>
                {title}
            </DialogTitle>
            <DialogContent sx={{ whiteSpace: 'pre-wrap' }}>
                {text}
            </DialogContent>
            <DialogActions>
                <Button
                    variant="solid"
                    color={confirmButtonColor}
                    onClick={onConfirm}
                >
                    {confirmButtonText || globalize.translate('ButtonOk')}
                </Button>
                <Button
                    variant="plain"
                    color="neutral"
                    onClick={onCancel}
                >
                    {globalize.translate('ButtonCancel')}
                </Button>
            </DialogActions>
        </ModalDialog>
    </Modal>
);

export default ConfirmDialog;