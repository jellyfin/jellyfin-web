import { vars } from 'styles/tokens.css.ts';

import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Dialog, DialogContent, DialogOverlay, DialogContentClass } from 'ui-primitives';
import { Button } from 'ui-primitives';
import { Box, Flex } from 'ui-primitives';
import { Text } from 'ui-primitives';
import { Heading } from 'ui-primitives';

export interface DialogButton {
    id: string;
    name: string;
    type?: 'primary' | 'secondary' | 'danger' | 'ghost';
    description?: string;
}

interface AlertDialogProps {
    isOpen: boolean;
    onButtonClick: (buttonId: string) => void;
    title?: string;
    text?: string;
    html?: string;
    buttons: DialogButton[];
}

export function AlertDialog({ isOpen, onButtonClick, title, text, html, buttons }: AlertDialogProps) {
    const handleButtonClick = (buttonId: string) => {
        onButtonClick(buttonId);
    };

    const getButtonVariant = (button: DialogButton): 'primary' | 'secondary' | 'danger' | 'ghost' => {
        return (button.type as 'primary' | 'secondary' | 'danger' | 'ghost') || 'primary';
    };

    return (
        <Dialog open={isOpen} onOpenChange={open => !open && onButtonClick('cancel')}>
            <DialogPrimitive.Portal>
                <DialogOverlay />
                <DialogPrimitive.Content className={DialogContentClass}>
                    <Box style={{ padding: vars.spacing['5'], maxWidth: '450px' }}>
                        {title && <Heading.H3>{title}</Heading.H3>}
                        {(text || html) && (
                            <Box style={{ marginTop: '12px' }}>
                                {html ? (
                                    <Box dangerouslySetInnerHTML={{ __html: html }} />
                                ) : (
                                    <Text color="secondary">{text}</Text>
                                )}
                            </Box>
                        )}

                        <Flex style={{ marginTop: '24px', gap: vars.spacing['3'], flexWrap: 'wrap' }}>
                            {buttons.map((button, index) => (
                                <Button
                                    key={button.id}
                                    variant={getButtonVariant(button)}
                                    onClick={() => handleButtonClick(button.id)}
                                >
                                    {button.name}
                                </Button>
                            ))}
                        </Flex>
                    </Box>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </Dialog>
    );
}

interface UseAlertOptions {
    title?: string;
    text?: string;
    html?: string;
    buttons?: DialogButton[];
}

export function useAlert(options: UseAlertOptions = {}) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [resolvePromise, setResolvePromise] = React.useState<((value: string) => void) | null>(null);

    const defaultButtons: DialogButton[] = options.buttons || [{ id: 'ok', name: 'OK', type: 'primary' as const }];

    const alert = (textOrOptions?: string | UseAlertOptions, titleOrUndefined?: string): Promise<string> => {
        let text = '';
        let title = '';

        if (typeof textOrOptions === 'string') {
            text = textOrOptions;
            title = titleOrUndefined || '';
        } else {
            text = textOrOptions?.text || '';
            title = options.title || '';
        }

        return new Promise(resolve => {
            setResolvePromise(() => resolve);
            setIsOpen(true);
        });
    };

    const handleButtonClick = (buttonId: string) => {
        setIsOpen(false);
        if (resolvePromise) {
            resolvePromise(buttonId);
        }
    };

    const dialog = (
        <AlertDialog
            isOpen={isOpen}
            onButtonClick={handleButtonClick}
            title={options.title}
            text={options.text}
            html={options.html}
            buttons={defaultButtons}
        />
    );

    return { alert, dialog };
}
