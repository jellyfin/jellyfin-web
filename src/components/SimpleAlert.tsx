import globalize from 'lib/globalize';
import React from 'react';
import { Button } from 'ui-primitives';
import { Box } from 'ui-primitives';
import {
    Dialog,
    DialogContentComponent,
    DialogOverlayComponent,
    DialogPortal,
    DialogTitle
} from 'ui-primitives';
import { Text } from 'ui-primitives';
import { vars } from 'styles/tokens.css.ts';

interface SimpleAlertDialog {
    open: boolean;
    title?: string;
    text: string;
    onClose: () => void;
}

const SimpleAlert = ({ open, title, text, onClose }: SimpleAlertDialog) => {
    return (
        <Dialog
            open={open}
            onOpenChange={nextOpen => {
                if (!nextOpen) {
                    onClose();
                }
            }}
        >
            <DialogPortal>
                <DialogOverlayComponent />
                <DialogContentComponent>
                    {title && <DialogTitle style={{ marginBottom: vars.spacing['4'] }}>{title}</DialogTitle>}
                    <Text style={{ whiteSpace: 'pre-wrap' }}>{text}</Text>
                    <Box style={{ display: 'flex', justifyContent: 'flex-end', marginTop: vars.spacing['6'] }}>
                        <Button onClick={onClose}>{globalize.translate('ButtonGotIt')}</Button>
                    </Box>
                </DialogContentComponent>
            </DialogPortal>
        </Dialog>
    );
};

export default SimpleAlert;
