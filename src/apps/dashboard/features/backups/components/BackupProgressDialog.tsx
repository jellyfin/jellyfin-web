import globalize from 'lib/globalize';

import React, { type FunctionComponent } from 'react';
import { vars } from 'styles/tokens.css.ts';
import {
    Dialog,
    DialogContentComponent,
    DialogOverlayComponent,
    DialogTitle,
    Flex,
    Progress
} from 'ui-primitives';

interface IProps {
    open: boolean;
    onClose?: () => void;
}

const BackupProgressDialog: FunctionComponent<IProps> = ({ open }) => {
    return (
        <Dialog open={open}>
            <DialogOverlayComponent />
            <DialogContentComponent title={globalize.translate('MessageBackupInProgress')}>
                <Flex style={{ gap: vars.spacing['4'] }}>
                    <Progress />
                </Flex>
            </DialogContentComponent>
        </Dialog>
    );
};

export default BackupProgressDialog;
