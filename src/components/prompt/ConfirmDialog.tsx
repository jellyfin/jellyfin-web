import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Dialog, DialogContent, DialogOverlay, DialogContentClass } from 'ui-primitives/Dialog';
import { Button } from 'ui-primitives/Button';
import { Box, Flex } from 'ui-primitives/Box';
import { Text } from 'ui-primitives/Text';
import globalize from 'lib/globalize';

interface ConfirmDialogProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    title: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
}

export function ConfirmDialog({
    isOpen,
    onConfirm,
    onCancel,
    title,
    message,
    confirmText,
    cancelText,
    isDestructive = false
}: ConfirmDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={open => !open && onCancel()}>
            <DialogPrimitive.Portal>
                <DialogOverlay />
                <DialogPrimitive.Content className={DialogContentClass}>
                    <Box style={{ padding: '24px', maxWidth: '400px' }}>
                        <DialogPrimitive.Title>{title}</DialogPrimitive.Title>
                        {message && <DialogPrimitive.Description>{message}</DialogPrimitive.Description>}

                        <Flex style={{ gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                            <Button variant="ghost" onClick={onCancel}>
                                {cancelText || globalize.translate('ButtonCancel')}
                            </Button>
                            <Button variant={isDestructive ? 'danger' : 'primary'} onClick={onConfirm}>
                                {confirmText || globalize.translate('ButtonOk')}
                            </Button>
                        </Flex>
                    </Box>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </Dialog>
    );
}

interface UseConfirmOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
}

export function useConfirm(options: UseConfirmOptions) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [resolvePromise, setResolvePromise] = React.useState<((value: boolean) => void) | null>(null);

    const confirm = (): Promise<boolean> => {
        return new Promise(resolve => {
            setResolvePromise(() => resolve);
            setIsOpen(true);
        });
    };

    const handleConfirm = () => {
        setIsOpen(false);
        if (resolvePromise) {
            resolvePromise(true);
        }
    };

    const handleCancel = () => {
        setIsOpen(false);
        if (resolvePromise) {
            resolvePromise(false);
        }
    };

    const dialog = <ConfirmDialog isOpen={isOpen} onConfirm={handleConfirm} onCancel={handleCancel} {...options} />;

    return { confirm, dialog };
}
