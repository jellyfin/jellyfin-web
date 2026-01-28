import { vars } from '../../../../../styles/tokens.css';

import React, { type FunctionComponent } from 'react';
import { Dialog, DialogOverlayComponent, DialogContentComponent, DialogTitle } from 'ui-primitives/Dialog';
import { Progress } from 'ui-primitives/Progress';
import { Flex } from 'ui-primitives/Box';
import globalize from 'lib/globalize';

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
