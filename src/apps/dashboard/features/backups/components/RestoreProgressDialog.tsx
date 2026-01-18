import React, { FunctionComponent } from 'react';
import Dialog from '@mui/material/Dialog/Dialog';
import DialogContent from '@mui/material/DialogContent/DialogContent';
import DialogTitle from '@mui/material/DialogTitle/DialogTitle';
import LinearProgress from '@mui/material/LinearProgress';
import DialogContentText from '@mui/material/DialogContentText/DialogContentText';
import Stack from '@mui/material/Stack/Stack';
import globalize from 'lib/globalize';

type IProps = {
    open: boolean
};

const RestoreProgressDialog: FunctionComponent<IProps> = ({ open }) => {
    return (
        <Dialog
            open={open}
            maxWidth={'xs'}
            fullWidth
        >
            <DialogTitle>{globalize.translate('MessageRestoreInProgress')}</DialogTitle>
            <DialogContent>
                <Stack spacing={2}>
                    <DialogContentText>{globalize.translate('MessageWaitingForServer')}</DialogContentText>
                    <LinearProgress />
                </Stack>
            </DialogContent>
        </Dialog>
    );
};

export default RestoreProgressDialog;
