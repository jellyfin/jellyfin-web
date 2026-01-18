import React, { FunctionComponent, useCallback } from 'react';
import globalize from 'lib/globalize';
import type { BackupOptionsDto } from '@jellyfin/sdk/lib/generated-client/models/backup-options-dto';
import Dialog from '@mui/material/Dialog/Dialog';
import DialogTitle from '@mui/material/DialogTitle/DialogTitle';
import DialogContent from '@mui/material/DialogContent/DialogContent';
import Stack from '@mui/material/Stack/Stack';
import DialogActions from '@mui/material/DialogActions/DialogActions';
import Button from '@mui/material/Button/Button';
import FormControl from '@mui/material/FormControl/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel/FormControlLabel';
import Checkbox from '@mui/material/Checkbox/Checkbox';
import FormGroup from '@mui/material/FormGroup';
import DialogContentText from '@mui/material/DialogContentText/DialogContentText';

type IProps = {
    open: boolean,
    onClose?: () => void,
    onCreate: (backupOptions: BackupOptionsDto) => void
};

const CreateBackupForm: FunctionComponent<IProps> = ({ open, onClose, onCreate }) => {
    const onSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);

        const data = Object.fromEntries(formData.entries());

        const backupOptions: BackupOptionsDto = {
            'Metadata': data.Metadata?.toString() === 'on',
            'Trickplay': data.Trickplay?.toString() === 'on',
            'Subtitles': data.Subtitles?.toString() === 'on'
        };

        onCreate(backupOptions);
    }, [ onCreate ]);

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
            <DialogTitle>{globalize.translate('ButtonCreateBackup')}</DialogTitle>

            <DialogContent>
                <Stack spacing={2}>
                    <DialogContentText>
                        {globalize.translate('MessageBackupDisclaimer')}
                    </DialogContentText>
                    <FormGroup>
                        <FormControl>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        name='Database'
                                        defaultChecked={true}
                                        disabled
                                    />
                                }
                                label={globalize.translate('LabelDatabase')}
                            />
                        </FormControl>

                        <FormControl>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        name='Metadata'
                                        defaultChecked={false}
                                    />
                                }
                                label={globalize.translate('LabelMetadata')}
                            />
                        </FormControl>

                        <FormControl>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        name='Subtitles'
                                        defaultChecked={false}
                                    />
                                }
                                label={globalize.translate('Subtitles')}
                            />
                        </FormControl>

                        <FormControl>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        name='Trickplay'
                                        defaultChecked={false}
                                    />
                                }
                                label={globalize.translate('Trickplay')}
                            />
                        </FormControl>
                    </FormGroup>
                </Stack>
            </DialogContent>

            <DialogActions>
                <Button
                    onClick={onClose}
                    variant='text'
                >{globalize.translate('ButtonCancel')}</Button>
                <Button type='submit'>{globalize.translate('Create')}</Button>
            </DialogActions>
        </Dialog>
    );
};

export default CreateBackupForm;
