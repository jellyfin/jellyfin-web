/**
 * @deprecated This route is mostly migrated but uses legacy table patterns.
 *
 * Migration:
 * - Uses TanStack Table (already migrated)
 * - Replace TablePage wrapper with DataTable component
 * - Replace InputDialog with TanStack Forms
 *
 * @see src/styles/LEGACY_DEPRECATION_GUIDE.md
 */

import type { AuthenticationInfo } from '@jellyfin/sdk/lib/generated-client/models/authentication-info';
import type { ColumnDef } from '@tanstack/react-table';
import DateTimeCell from 'apps/dashboard/components/table/DateTimeCell';
import TablePage from 'apps/dashboard/components/table/TablePage';
import { useApiKeys } from 'apps/dashboard/features/keys/api/useApiKeys';
import { useCreateKey } from 'apps/dashboard/features/keys/api/useCreateKey';
import { useRevokeKey } from 'apps/dashboard/features/keys/api/useRevokeKey';
import ConfirmDialog from 'components/ConfirmDialog';
import InputDialog from 'components/InputDialog';
import { parseISO } from 'date-fns';
import globalize from 'lib/globalize';
import React, { useCallback, useMemo, useState } from 'react';
import { Button, Flex, IconButton, Tooltip } from 'ui-primitives';

const AddIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
    </svg>
);

const DeleteIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
    </svg>
);

export const Component = () => {
    const [isCreateApiKeyPromptOpen, setIsCreateApiKeyPromptOpen] = useState(false);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [apiKeyToDelete, setApiKeyToDelete] = useState<string>('');
    const { data, isLoading } = useApiKeys();
    const keys = useMemo(() => data?.Items || [], [data]);
    const revokeKey = useRevokeKey();
    const createKey = useCreateKey();

    const columns = useMemo<ColumnDef<AuthenticationInfo>[]>(
        () => [
            {
                id: 'ApiKey',
                accessorKey: 'AccessToken',
                header: globalize.translate('HeaderApiKey'),
                size: 300
            },
            {
                id: 'AppName',
                accessorKey: 'AppName',
                header: globalize.translate('HeaderApp')
            },
            {
                id: 'DateIssued',
                accessorFn: (item) => (item.DateCreated ? parseISO(item.DateCreated) : undefined),
                cell: DateTimeCell,
                header: globalize.translate('HeaderDateIssued')
            }
        ],
        []
    );

    const renderRowActions = useCallback((row: AuthenticationInfo) => {
        return (
            <Flex style={{ display: 'flex' }}>
                <Tooltip title={globalize.translate('ButtonRevoke')}>
                    <IconButton
                        color="danger"
                        onClick={() => row.AccessToken && onRevokeKey(row.AccessToken)}
                    >
                        <DeleteIcon />
                    </IconButton>
                </Tooltip>
            </Flex>
        );
    }, []);

    const renderToolbar = useCallback(
        () => (
            <Button startDecorator={<AddIcon />} onClick={showNewKeyPopup}>
                {globalize.translate('HeaderNewApiKey')}
            </Button>
        ),
        []
    );

    const onRevokeKey = useCallback((accessToken: string) => {
        setApiKeyToDelete(accessToken);
        setIsConfirmDeleteOpen(true);
    }, []);

    const showNewKeyPopup = useCallback(() => {
        setIsCreateApiKeyPromptOpen(true);
    }, []);

    const onCreateApiKeyPromptClose = useCallback(() => {
        setIsCreateApiKeyPromptOpen(false);
    }, []);

    const onConfirmDelete = useCallback(() => {
        revokeKey.mutate(
            {
                key: apiKeyToDelete
            },
            {
                onSettled: () => {
                    setApiKeyToDelete('');
                    setIsConfirmDeleteOpen(false);
                }
            }
        );
    }, [revokeKey, apiKeyToDelete]);

    const onConfirmDeleteCancel = useCallback(() => {
        setApiKeyToDelete('');
        setIsConfirmDeleteOpen(false);
    }, []);

    const onConfirmCreate = useCallback(
        (name: string) => {
            createKey.mutate(
                {
                    app: name
                },
                {
                    onSettled: () => {
                        setIsCreateApiKeyPromptOpen(false);
                    }
                }
            );
        },
        [createKey]
    );

    return (
        <>
            <ConfirmDialog
                open={isConfirmDeleteOpen}
                title={globalize.translate('HeaderConfirmRevokeApiKey')}
                message={globalize.translate('MessageConfirmRevokeApiKey')}
                isDestructive={true}
                confirmText={globalize.translate('Delete')}
                onConfirm={onConfirmDelete}
                onCancel={onConfirmDeleteCancel}
            />
            <InputDialog
                open={isCreateApiKeyPromptOpen}
                title={globalize.translate('HeaderNewApiKey')}
                label={globalize.translate('LabelAppName')}
                helperText={globalize.translate('LabelAppNameExample')}
                confirmButtonText={globalize.translate('Create')}
                onConfirm={onConfirmCreate}
                onClose={onCreateApiKeyPromptClose}
            />
            <TablePage
                id="apiKeysPage"
                title={globalize.translate('HeaderApiKeys')}
                subtitle={globalize.translate('HeaderApiKeysHelp')}
                className="mainAnimatedPage type-interior"
                data={keys}
                columns={columns}
                isLoading={isLoading}
                enableRowActions={true}
                renderRowActions={renderRowActions}
                renderToolbar={renderToolbar}
            />
        </>
    );
};

Component.displayName = 'ApiKeysPage';
