import React, { FunctionComponent } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import LinearProgress from '@mui/material/LinearProgress';
import globalize from 'lib/globalize';

type IProps = {
    open: boolean
};

const BackupProgressDialog: FunctionComponent<IProps> = ({ open }) => {
    return (
        <Dialog
            open={open}
            maxWidth={'xs'}
            fullWidth
        >
            <DialogTitle>{globalize.translate('MessageBackupInProgress')}</DialogTitle>
            <DialogContent>
                <LinearProgress />
            </DialogContent>
        </Dialog>
    );
};

export default BackupProgressDialog;
