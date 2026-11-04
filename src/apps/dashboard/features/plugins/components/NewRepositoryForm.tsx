import React, { useCallback } from 'react';
import type { RepositoryInfo } from '@jellyfin/sdk/lib/generated-client/models/repository-info';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import globalize from 'lib/globalize';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';

type IProps = {
    open: boolean;
    isPending: boolean;
    hasError: boolean;
    onClose: () => void;
    onAdd: (repository: RepositoryInfo) => void;
};

const NewRepositoryForm = ({ open, onClose, onAdd, isPending, hasError }: IProps) => {
    const onSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isPending) return;

        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        const repository: RepositoryInfo = {
            Name: data.Name?.toString(),
            Url: data.Url?.toString(),
            Enabled: true
        };

        onAdd(repository);
    }, [ onAdd, isPending ]);

    return (
        <Dialog
            open={open}
            maxWidth={'xs'}
            fullWidth
            onClose={onClose}
            slotProps={{
                paper: {
                    component: 'form',
                    onSubmit
                }
            }}
        >
            <DialogTitle>{globalize.translate('HeaderNewRepository')}</DialogTitle>

            <DialogContent>
                <Stack spacing={3}>
                    {hasError && <Alert severity='error'>{globalize.translate('RepositoryAddError')}</Alert>}
                    <TextField
                        disabled={isPending}
                        name='Name'
                        label={globalize.translate('LabelRepositoryName')}
                        helperText={globalize.translate('LabelRepositoryNameHelp')}
                        slotProps={{
                            htmlInput: {
                                required: true
                            }
                        }}
                    />

                    <TextField
                        disabled={isPending}
                        required
                        name='Url'
                        label={globalize.translate('LabelRepositoryUrl')}
                        helperText={globalize.translate('LabelRepositoryUrlHelp')}
                        type='url'
                    />
                </Stack>
            </DialogContent>

            <DialogActions>
                <Button
                    disabled={isPending}
                    onClick={onClose}
                    variant='text'
                >{globalize.translate('ButtonCancel')}</Button>
                <Button type='submit' loading={isPending}>{globalize.translate('Add')}</Button>
            </DialogActions>
        </Dialog>
    );
};

export default NewRepositoryForm;
