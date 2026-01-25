import React, { type FunctionComponent, useCallback } from 'react';
import globalize from 'lib/globalize';
import type { BackupOptionsDto } from '@jellyfin/sdk/lib/generated-client/models/backup-options-dto';
import { Dialog, DialogOverlayComponent, DialogContentComponent, DialogTitle } from 'ui-primitives/Dialog';
import { Button } from 'ui-primitives/Button';
import { Flex } from 'ui-primitives/Box';
import { Checkbox } from 'ui-primitives/Checkbox';
import { FormControl, FormControlLabel, FormLabel } from 'ui-primitives/FormControl';

interface IProps {
    open: boolean;
    onClose?: () => void;
    onCreate: (backupOptions: BackupOptionsDto) => void;
}

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
        <Dialog open={open} onOpenChange={(open) => !open && onClose?.()}>
            <DialogOverlayComponent />
            <DialogContentComponent
                title={globalize.translate('ButtonCreateBackup')}
                description={globalize.translate('MessageBackupDisclaimer')}
            >
                <form onSubmit={onSubmit}>
                    <Flex style={{ flexDirection: 'column', gap: '16px' }}>
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
                    </Flex>

                    <Flex style={{ justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
                        <Button
                            variant='ghost'
                            onClick={onClose}
                        >{globalize.translate('ButtonCancel')}</Button>
                        <Button type='submit'>{globalize.translate('Create')}</Button>
                    </Flex>
                </form>
            </DialogContentComponent>
        </Dialog>
    );
};

export default CreateBackupForm;
