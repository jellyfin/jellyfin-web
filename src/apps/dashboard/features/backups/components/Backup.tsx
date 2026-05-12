import React, { FunctionComponent, useCallback, useState } from 'react';
import type { BackupManifestDto } from '@jellyfin/sdk/lib/generated-client/models/backup-manifest-dto';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import Restore from '@mui/icons-material/Restore';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import globalize from 'lib/globalize';
import BackupInfoDialog from './BackupInfoDialog';

type BackupProps = {
    backup: BackupManifestDto;
    onRestore: (backup: BackupManifestDto) => void;
};

const Backup: FunctionComponent<BackupProps> = ({ backup, onRestore }) => {
    const [ isInfoDialogOpen, setIsInfoDialogOpen ] = useState(false);

    const onDialogClose = useCallback(() => {
        setIsInfoDialogOpen(false);
    }, []);

    const openDialog = useCallback(() => {
        setIsInfoDialogOpen(true);
    }, []);

    const restore = useCallback(() => {
        onRestore(backup);
    }, [ backup, onRestore ]);

    return (
        <>
            <BackupInfoDialog
                backup={backup}
                onClose={onDialogClose}
                open={isInfoDialogOpen}
            />
            <ListItem
                disablePadding
                secondaryAction={
                    <Tooltip disableInteractive title={globalize.translate('LabelRestore')}>
                        <IconButton onClick={restore}>
                            <Restore />
                        </IconButton>
                    </Tooltip>
                }
            >
                <ListItemButton onClick={openDialog}>
                    <ListItemText
                        primary={backup.DateCreated}
                        secondary={backup.Path}
                        slotProps={{
                            primary: {
                                variant: 'h3'
                            },
                            secondary: {
                                variant: 'body1'
                            }
                        }}
                    />
                </ListItemButton>
            </ListItem>
        </>
    );
};

export default Backup;
