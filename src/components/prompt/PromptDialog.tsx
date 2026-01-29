import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Cross2Icon } from '@radix-ui/react-icons';
import globalize from 'lib/globalize';
import React, { type FormEvent, useState } from 'react';
import { vars } from 'styles/tokens.css.ts';
import { Box, Button, Flex, Input, Text } from 'ui-primitives';

interface PromptDialogProps {
    isOpen: boolean;
    onClose: (value?: string) => void;
    title?: string;
    label?: string;
    value?: string;
    description?: string;
    confirmText?: string;
}

export function PromptDialog({
    isOpen,
    onClose,
    title = '',
    label = '',
    value = '',
    description = '',
    confirmText
}: PromptDialogProps) {
    const [inputValue, setInputValue] = useState(value);

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onClose(inputValue);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    const dialogTitleStyle: React.CSSProperties = {
        fontSize: '18px',
        fontWeight: '600',
        margin: 0
    };

    const dialogDescriptionStyle: React.CSSProperties = {
        fontSize: vars.typography['2'].fontSize,
        color: vars.colors.textSecondary,
        marginBottom: vars.spacing['4']
    };

    const dialogContentStyle: React.CSSProperties = {
        backgroundColor: vars.colors.surface,
        borderRadius: vars.borderRadius.lg,
        boxShadow: vars.shadows.xl,
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: '450px',
        width: '90%',
        maxHeight: '85vh',
        overflowY: 'auto',
        zIndex: vars.zIndex.modal
    };

    const dialogOverlayStyle: React.CSSProperties = {
        backgroundColor: vars.colors.overlay,
        position: 'fixed',
        inset: 0,
        animation: 'fade-in 150ms ease',
        zIndex: vars.zIndex.modalBackdrop
    };

    return (
        <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay style={dialogOverlayStyle} />
                <DialogPrimitive.Content style={dialogContentStyle}>
                    <Box style={{ padding: vars.spacing['5'] }}>
                        <Flex
                            style={{
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: vars.spacing['4']
                            }}
                        >
                            {title && (
                                <DialogPrimitive.Title style={dialogTitleStyle}>
                                    {title}
                                </DialogPrimitive.Title>
                            )}
                            <DialogPrimitive.Close asChild>
                                <button
                                    type="button"
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '8px',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                    aria-label={globalize.translate('ButtonClose')}
                                >
                                    <Cross2Icon />
                                </button>
                            </DialogPrimitive.Close>
                        </Flex>

                        {description && (
                            <DialogPrimitive.Description style={dialogDescriptionStyle}>
                                {description}
                            </DialogPrimitive.Description>
                        )}

                        <form onSubmit={handleSubmit}>
                            <Input
                                id="txtInput"
                                label={label}
                                value={inputValue}
                                onChange={handleChange}
                                autoFocus
                            />

                            <Flex style={{ marginTop: '24px', justifyContent: 'flex-end' }}>
                                <Button type="submit" variant="primary">
                                    {confirmText || globalize.translate('ButtonOk')}
                                </Button>
                            </Flex>
                        </form>
                    </Box>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}

interface UsePromptOptions {
    title?: string;
    label?: string;
    value?: string;
    description?: string;
    confirmText?: string;
}

export function usePrompt(options: UsePromptOptions = {}) {
    const [isOpen, setIsOpen] = useState(false);
    const [resolvePromise, setResolvePromise] = useState<((value: string) => void) | null>(null);

    const prompt = (): Promise<string> => {
        return new Promise((resolve) => {
            setResolvePromise(() => resolve);
            setIsOpen(true);
        });
    };

    const handleClose = (value?: string) => {
        setIsOpen(false);
        if (resolvePromise) {
            if (value !== undefined) {
                resolvePromise(value);
            } else {
                resolvePromise('');
            }
        }
    };

    const dialog = <PromptDialog isOpen={isOpen} onClose={handleClose} {...options} />;

    return { prompt, dialog };
}
