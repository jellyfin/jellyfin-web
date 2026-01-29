import * as DialogPrimitive from '@radix-ui/react-dialog';
import globalize from 'lib/globalize';
import React from 'react';
import { vars } from 'styles/tokens.css.ts';
import {
    Box,
    Button,
    Dialog,
    DialogContent,
    DialogContentClass,
    DialogOverlay,
    Flex,
    Text
} from 'ui-primitives';

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
        <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
            <DialogPrimitive.Portal>
                <DialogOverlay />
                <DialogPrimitive.Content className={DialogContentClass}>
                    <Box style={{ padding: vars.spacing['5'], maxWidth: '400px' }}>
                        <DialogPrimitive.Title>{title}</DialogPrimitive.Title>
                        {message && (
                            <DialogPrimitive.Description>{message}</DialogPrimitive.Description>
                        )}

                        <Flex
                            style={{
                                gap: vars.spacing['3'],
                                justifyContent: 'flex-end',
                                marginTop: '24px'
                            }}
                        >
                            <Button variant="ghost" onClick={onCancel}>
                                {cancelText || globalize.translate('ButtonCancel')}
                            </Button>
                            <Button
                                variant={isDestructive ? 'danger' : 'primary'}
                                onClick={onConfirm}
                            >
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
    const [resolvePromise, setResolvePromise] = React.useState<((value: boolean) => void) | null>(
        null
    );

    const confirm = (): Promise<boolean> => {
        return new Promise((resolve) => {
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

    const dialog = (
        <ConfirmDialog
            isOpen={isOpen}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            {...options}
        />
    );

    return { confirm, dialog };
}
