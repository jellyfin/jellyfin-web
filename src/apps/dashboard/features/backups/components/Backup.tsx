import React, { type FunctionComponent, useCallback, useState } from 'react';
import type { BackupManifestDto } from '@jellyfin/sdk/lib/generated-client/models/backup-manifest-dto';
import globalize from 'lib/globalize';
import BackupInfoDialog from './BackupInfoDialog';
import { List, ListItem, ListItemButton, ListItemContent } from 'ui-primitives/List';
import { IconButton } from 'ui-primitives/IconButton';
import { Tooltip } from 'ui-primitives/Tooltip';
import { Text } from 'ui-primitives/Text';

const RestoreIcon = () => (
    <svg width='20' height='20' viewBox='0 0 24 24' fill='currentColor'>
        <path d='M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z'/>
    </svg>
);

interface BackupProps {
    backup: BackupManifestDto;
    onRestore: (backup: BackupManifestDto) => void;
}

const Backup: FunctionComponent<BackupProps> = ({ backup, onRestore }) => {
    const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);

    const onDialogClose = useCallback(() => {
        setIsInfoDialogOpen(false);
    }, []);

    const openDialog = useCallback(() => {
        setIsInfoDialogOpen(true);
    }, []);

    const restore = useCallback(() => {
        onRestore(backup);
    }, [backup, onRestore]);

    return (
        <>
            <BackupInfoDialog backup={backup} onClose={onDialogClose} open={isInfoDialogOpen} />
            <ListItem
                disablePadding
                endAction={
                    <Tooltip title={globalize.translate('LabelRestore')}>
                        <IconButton variant='plain' onClick={restore}>
                            <RestoreIcon />
                        </IconButton>
                    </Tooltip>
                }
            >
                <ListItemButton onClick={openDialog}>
                    <ListItemContent>
                        <Text size='lg' weight='bold'>
                            {backup.DateCreated}
                        </Text>
                        <Text size='sm' color='secondary'>
                            {backup.Path}
                        </Text>
                    </ListItemContent>
                </ListItemButton>
            </ListItem>
        </>
    );
};

export default Backup;
