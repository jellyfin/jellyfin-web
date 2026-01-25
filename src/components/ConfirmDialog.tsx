import React, { type FC } from 'react';
import globalize from 'lib/globalize';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogCloseButton } from 'ui-primitives/Dialog';
import { Button } from 'ui-primitives/Button';
import { Flex } from 'ui-primitives/Box';
import { vars } from 'styles/tokens.css';

export interface ConfirmDialogProps {
    open: boolean;
    confirmButtonColor?: 'primary' | 'danger' | 'neutral' | 'success' | 'warning' | 'error';
    confirmButtonText?: string;
    confirmText?: string;
    title: string;
    text?: string;
    message?: string;
    onCancel: () => void;
    onConfirm: () => void;
    isDestructive?: boolean;
}

const ConfirmDialog: FC<ConfirmDialogProps> = ({
    open,
    confirmButtonColor = 'primary',
    confirmButtonText,
    confirmText,
    title,
    text,
    message,
    onCancel,
    onConfirm,
    isDestructive
}) => {
    const effectiveText = text || message || '';
    const effectiveConfirmText = confirmButtonText || confirmText || globalize.translate('ButtonOk');
    const effectiveColor = isDestructive ? 'danger' : confirmButtonColor === 'error' ? 'danger' : confirmButtonColor;

    return (
        <Dialog open={open} onOpenChange={onCancel}>
            <DialogContent style={{ minWidth: 320, whiteSpace: 'pre-wrap' }}>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>{effectiveText}</DialogDescription>
                <Flex style={{ gap: vars.spacing.sm, marginTop: vars.spacing.md }}>
                    <Button variant="primary" color={effectiveColor as 'primary' | 'danger'} onClick={onConfirm}>
                        {effectiveConfirmText}
                    </Button>
                    <Button variant="plain" color="neutral" onClick={onCancel}>
                        {globalize.translate('ButtonCancel')}
                    </Button>
                </Flex>
            </DialogContent>
        </Dialog>
    );
};

export default ConfirmDialog;
