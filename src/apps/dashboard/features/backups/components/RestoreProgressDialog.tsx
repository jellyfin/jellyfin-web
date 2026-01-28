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

const RestoreProgressDialog: FunctionComponent<IProps> = ({ open }) => {
    return (
        <Dialog open={open}>
            <DialogOverlayComponent />
            <DialogContentComponent title={globalize.translate('MessageRestoreInProgress')}>
                <Flex style={{ flexDirection: 'column', gap: vars.spacing['4'] }}>
                    <div>{globalize.translate('MessageWaitingForServer')}</div>
                    <Progress />
                </Flex>
            </DialogContentComponent>
        </Dialog>
    );
};

export default RestoreProgressDialog;
