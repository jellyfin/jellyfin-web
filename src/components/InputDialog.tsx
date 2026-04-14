import React, { useCallback, useState } from 'react';
import Button from '@mui/material/Button';
import Dialog, { type DialogProps } from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import globalize from 'lib/globalize';
import Stack from '@mui/material/Stack';

interface InputDialogProps extends DialogProps {
    title: string;
    label: string;
    helperText?: string;
    initialText?: string;
    confirmButtonText?: string;
    onClose: () => void;
    onConfirm: (text: string) => void;
};

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
    const [ text, setText ] = useState(initialText || '');

    const onTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setText(e.target.value);
    }, []);

    const onConfirmClick = useCallback(() => {
        onConfirm(text);
        setText('');
    }, [ text, onConfirm ]);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth='xs'
            fullWidth
        >
            {title && (
                <DialogTitle>
                    {title || ''}
                </DialogTitle>
            )}
            <DialogContent>
                <Stack>
                    <TextField
                        label={label}
                        value={text}
                        helperText={helperText}
                        onChange={onTextChange}
                        variant='standard'
                    />
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onConfirmClick}>
                    {confirmButtonText || globalize.translate('ButtonOk')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default InputDialog;
