import type { BackupOptionsDto } from '@jellyfin/sdk/lib/generated-client/models/backup-options-dto';
import globalize from 'lib/globalize';
import React, { type FunctionComponent, useCallback } from 'react';
import { vars } from 'styles/tokens.css.ts';
import {
    Button,
    Checkbox,
    Dialog,
    DialogContentComponent,
    DialogOverlayComponent,
    DialogTitle,
    Flex,
    FormControl,
    FormControlLabel,
    FormLabel
} from 'ui-primitives';

interface IProps {
    open: boolean;
    onClose?: () => void;
    onCreate: (backupOptions: BackupOptionsDto) => void;
}

const CreateBackupForm: FunctionComponent<IProps> = ({ open, onClose, onCreate }) => {
    const onSubmit = useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();

            const formData = new FormData(e.currentTarget);

            const data = Object.fromEntries(formData.entries());

            const backupOptions: BackupOptionsDto = {
                Metadata: data.Metadata?.toString() === 'on',
                Trickplay: data.Trickplay?.toString() === 'on',
                Subtitles: data.Subtitles?.toString() === 'on'
            };

            onCreate(backupOptions);
        },
        [onCreate]
    );

    return (
        <Dialog open={open} onOpenChange={(open) => !open && onClose?.()}>
            <DialogOverlayComponent />
            <DialogContentComponent
                title={globalize.translate('ButtonCreateBackup')}
                description={globalize.translate('MessageBackupDisclaimer')}
            >
                <form onSubmit={onSubmit}>
                    <Flex style={{ flexDirection: 'column', gap: vars.spacing['4'] }}>
                        <FormControl>
                            <FormControlLabel
                                control={
                                    <Checkbox name="Database" defaultChecked={true} disabled />
                                }
                                label={globalize.translate('LabelDatabase')}
                            />
                        </FormControl>

                        <FormControl>
                            <FormControlLabel
                                control={<Checkbox name="Metadata" defaultChecked={false} />}
                                label={globalize.translate('LabelMetadata')}
                            />
                        </FormControl>

                        <FormControl>
                            <FormControlLabel
                                control={<Checkbox name="Subtitles" defaultChecked={false} />}
                                label={globalize.translate('Subtitles')}
                            />
                        </FormControl>

                        <FormControl>
                            <FormControlLabel
                                control={<Checkbox name="Trickplay" defaultChecked={false} />}
                                label={globalize.translate('Trickplay')}
                            />
                        </FormControl>
                    </Flex>

                    <Flex
                        style={{
                            justifyContent: 'flex-end',
                            gap: vars.spacing['2'],
                            marginTop: '24px'
                        }}
                    >
                        <Button variant="ghost" onClick={onClose}>
                            {globalize.translate('ButtonCancel')}
                        </Button>
                        <Button type="submit">{globalize.translate('Create')}</Button>
                    </Flex>
                </form>
            </DialogContentComponent>
        </Dialog>
    );
};

export default CreateBackupForm;
