import type { BackupManifestDto } from '@jellyfin/sdk/lib/generated-client/models/backup-manifest-dto';
import { CopyIcon } from '@radix-ui/react-icons';
import globalize from 'lib/globalize';
import React, { type FunctionComponent, useCallback, useState } from 'react';
import { copy } from 'scripts/clipboard';
import { Dialog, DialogContentComponent as DialogContent, DialogTitle } from 'ui-primitives/Dialog';
import { Button } from 'ui-primitives/Button';
import { IconButton } from 'ui-primitives/IconButton';
import { Flex } from 'ui-primitives/Box';
import { Text } from 'ui-primitives/Text';
import { Checkbox } from 'ui-primitives/Checkbox';
import { vars } from 'styles/tokens.css';
import Toast from 'apps/dashboard/components/Toast';

interface IProps {
    backup: BackupManifestDto;
    open: boolean;
    onClose: () => void;
}

const BackupInfoDialog: FunctionComponent<Readonly<IProps>> = ({ backup, open, onClose }: IProps): React.ReactElement => {
    const [isCopiedToastOpen, setIsCopiedToastOpen] = useState(false);

    const handleToastClose = useCallback(() => {
        setIsCopiedToastOpen(false);
    }, []);

    const copyPath = useCallback(async () => {
        if (backup.Path) {
            await copy(backup.Path);
            setIsCopiedToastOpen(true);
        }
    }, [backup.Path]);

    return (
        <Dialog open={open} onOpenChange={open => !open && onClose()}>
            <Toast open={isCopiedToastOpen} onClose={handleToastClose} message={globalize.translate('Copied')} />
            <DialogContent title={backup.DateCreated}>
                <Flex style={{ flexDirection: 'column', gap: vars.spacing.md }}>
                    <Flex style={{ flexDirection: 'column', gap: vars.spacing.xs }}>
                        <Flex style={{ gap: vars.spacing.md, alignItems: 'center' }}>
                            <Text weight='bold'>{globalize.translate('LabelPath')}</Text>
                            <Flex style={{ gap: vars.spacing.xs, alignItems: 'center' }}>
                                <Text color='secondary'>{backup.Path}</Text>
                                <IconButton variant='plain' size='sm' onClick={copyPath}>
                                    <CopyIcon />
                                </IconButton>
                            </Flex>
                        </Flex>
                        <Flex style={{ gap: vars.spacing.md }}>
                            <Text weight='bold'>{globalize.translate('LabelVersion')}</Text>
                            <Text color='secondary'>{backup.ServerVersion}</Text>
                        </Flex>
                    </Flex>

                    <Flex style={{ flexDirection: 'column', gap: vars.spacing.xs }}>
                        <Checkbox name='Database' checked={true} disabled>
                            {globalize.translate('LabelDatabase')}
                        </Checkbox>
                        <Checkbox name='Metadata' checked={backup.Options?.Metadata} disabled>
                            {globalize.translate('LabelMetadata')}
                        </Checkbox>
                        <Checkbox name='Subtitles' checked={backup.Options?.Subtitles} disabled>
                            {globalize.translate('Subtitles')}
                        </Checkbox>
                        <Checkbox name='Trickplay' checked={backup.Options?.Trickplay} disabled>
                            {globalize.translate('Trickplay')}
                        </Checkbox>
                    </Flex>
                </Flex>
            </DialogContent>

            <Flex style={{ justifyContent: 'flex-end', gap: vars.spacing.sm, padding: vars.spacing.md }}>
                <Button variant='primary' onClick={onClose}>
                    {globalize.translate('ButtonOk')}
                </Button>
            </Flex>
        </Dialog>
    );
};

export default BackupInfoDialog;
