/**
 * @deprecated This route uses legacy form patterns.
 *
 * Migration:
 * - Replace CreateBackupForm with TanStack Forms + Zod
 * - Use ui-primitives Alert instead of custom alert handling
 *
 * @see src/styles/LEGACY_DEPRECATION_GUIDE.md
 */

import { Box, Flex, FlexCol } from 'ui-primitives';
import { Button } from 'ui-primitives';
import { Text, Heading } from 'ui-primitives';
import { Alert } from 'ui-primitives';
import { List, ListItem } from 'ui-primitives';
import { Spacer } from 'ui-primitives';
import { Paper } from 'ui-primitives';
import { useBackups } from 'apps/dashboard/features/backups/api/useBackups';
import Page from 'components/Page';
import globalize from 'lib/globalize';
import React, { useCallback, useEffect, useState } from 'react';
import Loading from 'components/loading/LoadingComponent';
import CreateBackupForm from 'apps/dashboard/features/backups/components/CreateBackupForm';
import type { BackupOptionsDto } from '@jellyfin/sdk/lib/generated-client/models/backup-options-dto';
import type { BackupManifestDto } from '@jellyfin/sdk/lib/generated-client/models/backup-manifest-dto';
import { useCreateBackup } from 'apps/dashboard/features/backups/api/useCreateBackup';
import BackupProgressDialog from 'apps/dashboard/features/backups/components/BackupProgressDialog';
import Backup from 'apps/dashboard/features/backups/components/Backup';
import SimpleAlert from 'components/SimpleAlert';
import RestoreConfirmationDialog from 'apps/dashboard/features/backups/components/RestoreConfirmationDialog';
import { useRestoreBackup } from 'apps/dashboard/features/backups/api/useRestoreBackup';
import RestoreProgressDialog from 'apps/dashboard/features/backups/components/RestoreProgressDialog';
import { useApi } from 'hooks/useApi';
import { getSystemApi } from '@jellyfin/sdk/lib/utils/api/system-api';

const AddIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

export const Component = () => {
    const { api } = useApi();
    const { data: backups, isPending, isError } = useBackups();
    const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
    const [backupInProgress, setBackupInProgress] = useState(false);
    const [restoreInProgress, setRestoreInProgress] = useState(false);
    const [isRestoreSuccess, setIsRestoreSuccess] = useState(false);
    const [isErrorOccurred, setIsErrorOccurred] = useState(false);
    const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
    const [backupToRestore, setBackupToRestore] = useState<BackupManifestDto | null>(null);
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

    const onBackupCreate = useCallback(
        (backupOptions: BackupOptionsDto) => {
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
        },
        [createBackup]
    );

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
                    })
                    .catch(() => {
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
        <Page id="backupsPage" title={globalize.translate('HeaderBackups')} className="mainAnimatedPage type-interior">
            <BackupProgressDialog open={backupInProgress} />
            <RestoreProgressDialog open={restoreInProgress} />
            <CreateBackupForm open={isCreateFormOpen} onClose={onCreateFormClose} onCreate={onBackupCreate} />
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
            <Box className="content-primary">
                {isError ? (
                    <Alert variant="error">{globalize.translate('BackupsPageLoadError')}</Alert>
                ) : (
                    <FlexCol gap="lg">
                        <Heading.H1>{globalize.translate('HeaderBackups')}</Heading.H1>
                        <Text color="secondary">{globalize.translate('HeaderBackupsHelp')}</Text>

                        <Box style={{ alignSelf: 'flex-start' }}>
                            <Button startIcon={<AddIcon />} onClick={onCreateClick}>
                                {globalize.translate('ButtonCreateBackup')}
                            </Button>
                        </Box>

                        <Box className="readOnlyContent">
                            {backups.length > 0 && (
                                <Paper>
                                    <List>
                                        {backups.map(backup => {
                                            return (
                                                <ListItem key={backup.Path}>
                                                    <Backup backup={backup} onRestore={promptRestore} />
                                                </ListItem>
                                            );
                                        })}
                                    </List>
                                </Paper>
                            )}
                        </Box>
                    </FlexCol>
                )}
            </Box>
        </Page>
    );
};
