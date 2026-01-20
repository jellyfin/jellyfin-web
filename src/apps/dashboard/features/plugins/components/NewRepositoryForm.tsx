import React, { useCallback } from 'react';
import type { RepositoryInfo } from '@jellyfin/sdk/lib/generated-client/models/repository-info';
import Modal from '@mui/joy/Modal';
import ModalDialog from '@mui/joy/ModalDialog';
import DialogTitle from '@mui/joy/DialogTitle';
import DialogContent from '@mui/joy/DialogContent';
import DialogActions from '@mui/joy/DialogActions';
import Button from '@mui/joy/Button';
import Stack from '@mui/joy/Stack';
import globalize from 'lib/globalize';
import { EmbyInput } from '../../../../elements';

type IProps = {
    open: boolean;
    onClose: () => void;
    onAdd: (repository: RepositoryInfo) => void;
};

const NewRepositoryForm = ({ open, onClose, onAdd }: IProps) => {
    const onSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        const repository: RepositoryInfo = {
            Name: data.Name?.toString(),
            Url: data.Url?.toString(),
            Enabled: true
        };

        onAdd(repository);
    }, [ onAdd ]);

    return (
        <Modal open={open} onClose={onClose}>
            <ModalDialog
                component="form"
                onSubmit={onSubmit}
                sx={{ minWidth: 400 }}
            >
                <DialogTitle>{globalize.translate('HeaderNewRepository')}</DialogTitle>

                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <EmbyInput
                            name='Name'
                            label={globalize.translate('LabelRepositoryName')}
                            helperText={globalize.translate('LabelRepositoryNameHelp')}
                            required
                            autoFocus
                        />

                        <EmbyInput
                            name='Url'
                            label={globalize.translate('LabelRepositoryUrl')}
                            helperText={globalize.translate('LabelRepositoryUrlHelp')}
                            type='url'
                            required
                        />
                    </Stack>
                </DialogContent>

                <DialogActions sx={{ mt: 2 }}>
                    <Button type='submit'>{globalize.translate('Add')}</Button>
                    <Button
                        onClick={onClose}
                        variant='plain'
                        color="neutral"
                    >
                        {globalize.translate('ButtonCancel')}
                    </Button>
                </DialogActions>
            </ModalDialog>
        </Modal>
    );
};

export default NewRepositoryForm;