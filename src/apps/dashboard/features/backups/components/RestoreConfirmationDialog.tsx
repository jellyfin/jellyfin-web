import Button from '@mui/material/Button/Button';
import Dialog from '@mui/material/Dialog/Dialog';
import DialogActions from '@mui/material/DialogActions/DialogActions';
import DialogContent from '@mui/material/DialogContent/DialogContent';
import DialogContentText from '@mui/material/DialogContentText/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle/DialogTitle';
import globalize from 'lib/globalize';
import React, { FunctionComponent } from 'react';

type IProps = {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
};

const RestoreConfirmationDialog: FunctionComponent<IProps> = ({ open, onClose, onConfirm }: IProps) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth={'xs'}
            fullWidth
        >
            <DialogTitle>
                {globalize.translate('LabelRestore')}
            </DialogTitle>

            <DialogContent>
                <DialogContentText>
                    {globalize.translate('MessageRestoreDisclaimer')}
                </DialogContentText>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} variant='text'>
                    {globalize.translate('ButtonCancel')}
                </Button>
                <Button onClick={onConfirm}>
                    {globalize.translate('LabelRestore')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default RestoreConfirmationDialog;
