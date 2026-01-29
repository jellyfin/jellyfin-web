import globalize from 'lib/globalize';
import React, { useCallback, useState } from 'react';
import { vars } from 'styles/tokens.css.ts';
import {
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    Flex,
    FormControl,
    FormHelperText,
    FormLabel,
    Input
} from 'ui-primitives';

interface InputDialogProps {
    open: boolean;
    title: string;
    label: string;
    helperText?: string;
    initialText?: string;
    confirmButtonText?: string;
    onClose: () => void;
    onConfirm: (text: string) => void;
}

const InputDialog = ({
    open,
    title,
    label,
    helperText,
    initialText,
    onClose,
    confirmButtonText,
    onConfirm
}: InputDialogProps) => {
    const [text, setText] = useState(initialText || '');

    const onTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setText(e.target.value);
    }, []);

    const onConfirmClick = useCallback(() => {
        onConfirm(text);
        setText('');
    }, [text, onConfirm]);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent style={{ minWidth: 320 }}>
                {title && <DialogTitle>{title}</DialogTitle>}
                <Flex style={{ flexDirection: 'column', gap: vars.spacing['5'] }}>
                    <FormControl>
                        <FormLabel>{label}</FormLabel>
                        <Input autoFocus value={text} onChange={onTextChange} />
                        {helperText && <FormHelperText>{helperText}</FormHelperText>}
                    </FormControl>
                    <Flex style={{ gap: vars.spacing['4'], marginTop: vars.spacing['4'] }}>
                        <Button variant="primary" color="primary" onClick={onConfirmClick}>
                            {confirmButtonText || globalize.translate('ButtonOk')}
                        </Button>
                        <Button variant="plain" color="neutral" onClick={onClose}>
                            {globalize.translate('ButtonCancel')}
                        </Button>
                    </Flex>
                </Flex>
            </DialogContent>
        </Dialog>
    );
};

export default InputDialog;
