import { Button } from 'ui-primitives/Button';
import { Dialog, DialogOverlayComponent, DialogContentComponent, DialogTitle } from 'ui-primitives/Dialog';
import { Flex } from 'ui-primitives/Box';
import globalize from 'lib/globalize';
import React, { type FunctionComponent } from 'react';

interface IProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const RestoreConfirmationDialog: FunctionComponent<IProps> = ({ open, onClose, onConfirm }: IProps) => {
    return (
        <Dialog open={open} onOpenChange={open => !open && onClose()}>
            <DialogOverlayComponent />
            <DialogContentComponent
                title={globalize.translate('LabelRestore')}
                description={globalize.translate('MessageRestoreDisclaimer')}
            >
                <Flex style={{ justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                    <Button variant="ghost" onClick={onClose}>
                        {globalize.translate('ButtonCancel')}
                    </Button>
                    <Button onClick={onConfirm}>{globalize.translate('LabelRestore')}</Button>
                </Flex>
            </DialogContentComponent>
        </Dialog>
    );
};

export default RestoreConfirmationDialog;
