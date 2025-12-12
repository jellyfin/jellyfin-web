import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import { useBackups } from '@/apps/dashboard/features/backups/api/useBackups';
import Page from '@/components/Page';
import globalize from '@/lib/globalize';
import React, { useCallback, useEffect, useState } from 'react';
import Loading from '@/components/loading/LoadingComponent';
import Alert from '@mui/material/Alert';
import List from '@mui/material/List';
import CreateBackupForm from '@/apps/dashboard/features/backups/components/CreateBackupForm';
import type { BackupOptionsDto } from '@jellyfin/sdk/lib/generated-client/models/backup-options-dto';
import type { BackupManifestDto } from '@jellyfin/sdk/lib/generated-client/models/backup-manifest-dto';
import { useCreateBackup } from '@/apps/dashboard/features/backups/api/useCreateBackup';
import BackupProgressDialog from '@/apps/dashboard/features/backups/components/BackupProgressDialog';
import Backup from '@/apps/dashboard/features/backups/components/Backup';
import SimpleAlert from '@/components/SimpleAlert';
import RestoreConfirmationDialog from '@/apps/dashboard/features/backups/components/RestoreConfirmationDialog';
import { useRestoreBackup } from '@/apps/dashboard/features/backups/api/useRestoreBackup';
import RestoreProgressDialog from '@/apps/dashboard/features/backups/components/RestoreProgressDialog';
import { useApi } from '@/hooks/useApi';
import { getSystemApi } from '@jellyfin/sdk/lib/utils/api/system-api';

export const Component = () => {
    const { api } = useApi();
    const { data: backups, isPending, isError } = useBackups();
    const [ isCreateFormOpen, setIsCreateFormOpen ] = useState(false);
    const [ backupInProgress, setBackupInProgress ] = useState(false);
    const [ restoreInProgress, setRestoreInProgress ] = useState(false);
    const [ isRestoreSuccess, setIsRestoreSuccess ] = useState(false);
    const [ isErrorOccurred, setIsErrorOccurred ] = useState(false);
    const [ isRestoreDialogOpen, setIsRestoreDialogOpen ] = useState(false);
    const [ backupToRestore, setBackupToRestore ] = useState<BackupManifestDto | null>(null);
    const createBackup = useCreateBackup();
    const restoreBackup = useRestoreBackup();

    const onCreateClick = useCallback(() => {
        setIsCreateFormOpen(true);
    }, []);

    const onCreateFormClose = useCallback(() => {
        setIsCreateFormOpen(false);
    }, []);

    const onRestoreDialogClose = useCallback(() => {
        setIsRestoreDialogOpen(false);
    }, []);

    const onErrorAlertClose = useCallback(() => {
        setIsErrorOccurred(false);
    }, []);

    const onRestoreSuccessAlertClose = useCallback(() => {
        setIsRestoreSuccess(false);
    }, []);

    const onBackupCreate = useCallback((backupOptions: BackupOptionsDto) => {
        setBackupInProgress(true);
        setIsCreateFormOpen(false);
        createBackup.mutate(backupOptions, {
            onError: () => {
                setIsErrorOccurred(true);
            },
            onSettled: () => {
                setBackupInProgress(false);
            }
        });
    }, [ createBackup ]);

    const promptRestore = useCallback((backup: BackupManifestDto) => {
        setIsRestoreDialogOpen(true);
        setBackupToRestore(backup);
    }, []);

    const onRestoreConfirm = useCallback(() => {
        if (backupToRestore?.Path) {
            restoreBackup.mutate(backupToRestore?.Path, {
                onSuccess: () => {
                    setRestoreInProgress(true);
                },
                onError: () => {
                    setIsErrorOccurred(true);
                },
                onSettled: () => {
                    setIsRestoreDialogOpen(false);
                }
            });
        }
    }, [backupToRestore, restoreBackup]);

    useEffect(() => {
        if (restoreInProgress) {
            const serverCheckInterval = setInterval(() => {
                void getSystemApi(api!)
                    .getPublicSystemInfo()
                    .then(() => {
                        setRestoreInProgress(false);
                        setIsRestoreSuccess(true);
                        clearInterval(serverCheckInterval);
                    }).catch(() => {
                        // Server is still down
                    });
            }, 45000);

            return () => {
                clearInterval(serverCheckInterval);
            };
        }
    }, [api, restoreInProgress]);

    if (isPending) {
        return <Loading />;
    }

    return (
        <Page
            id='backupsPage'
            title={globalize.translate('HeaderBackups')}
            className='mainAnimatedPage type-interior'
        >
            <BackupProgressDialog open={backupInProgress} />
            <RestoreProgressDialog open={restoreInProgress} />
            <CreateBackupForm
                open={isCreateFormOpen}
                onClose={onCreateFormClose}
                onCreate={onBackupCreate}
            />
            <SimpleAlert
                open={isErrorOccurred}
                text={globalize.translate('UnknownError')}
                onClose={onErrorAlertClose}
            />
            <SimpleAlert
                open={isRestoreSuccess}
                title={globalize.translate('Success')}
                text={globalize.translate('MessageRestoreSuccess')}
                onClose={onRestoreSuccessAlertClose}
            />
            <RestoreConfirmationDialog
                open={isRestoreDialogOpen}
                onClose={onRestoreDialogClose}
                onConfirm={onRestoreConfirm}
            />
            <Box className='content-primary'>
                {isError ? (
                    <Alert severity='error'>{globalize.translate('BackupsPageLoadError')}</Alert>
                ) : (
                    <Stack spacing={3}>
                        <Typography variant='h1'>
                            {globalize.translate('HeaderBackups')}
                        </Typography>
                        <Typography>
                            {globalize.translate('HeaderBackupsHelp')}
                        </Typography>

                        <Button
                            sx={{ alignSelf: 'flex-start' }}
                            startIcon={<AddIcon />}
                            onClick={onCreateClick}
                        >
                            {globalize.translate('ButtonCreateBackup')}
                        </Button>

                        <Box className='readOnlyContent'>
                            {backups.length > 0 && (
                                <List sx={{ bgcolor: 'background.paper' }}>
                                    {backups.map(backup => {
                                        return <Backup
                                            key={backup.Path}
                                            backup={backup}
                                            onRestore={promptRestore}
                                        />;
                                    })}
                                </List>
                            )}
                        </Box>
                    </Stack>
                )}
            </Box>
        </Page>
    );
};
