import React, { useCallback, useState } from 'react';
import Button from '@mui/joy/Button';
import Modal from '@mui/joy/Modal';
import ModalDialog from '@mui/joy/ModalDialog';
import DialogTitle from '@mui/joy/DialogTitle';
import DialogContent from '@mui/joy/DialogContent';
import DialogActions from '@mui/joy/DialogActions';
import Input from '@mui/joy/Input';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import FormHelperText from '@mui/joy/FormHelperText';
import Stack from '@mui/joy/Stack';
import globalize from 'lib/globalize';

interface InputDialogProps {
    open: boolean;
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
        <Modal open={open} onClose={onClose}>
            <ModalDialog sx={{ minWidth: 320 }}>
                {title && (
                    <DialogTitle>
                        {title}
                    </DialogTitle>
                )}
                <DialogContent>
                    <Stack spacing={2}>
                        <FormControl>
                            <FormLabel>{label}</FormLabel>
                            <Input
                                autoFocus
                                value={text}
                                onChange={onTextChange}
                            />
                            {helperText && <FormHelperText>{helperText}</FormHelperText>}
                        </FormControl>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button variant="solid" color="primary" onClick={onConfirmClick}>
                        {confirmButtonText || globalize.translate('ButtonOk')}
                    </Button>
                    <Button variant="plain" color="neutral" onClick={onClose}>
                        {globalize.translate('ButtonCancel')}
                    </Button>
                </DialogActions>
            </ModalDialog>
        </Modal>
    );
};

export default InputDialog;