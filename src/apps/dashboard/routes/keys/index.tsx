import type { AuthenticationInfo } from '@jellyfin/sdk/lib/generated-client/models/authentication-info';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import { useTheme } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import parseISO from 'date-fns/parseISO';
import { type MRT_ColumnDef, type MRT_Theme, useMaterialReactTable } from 'material-react-table';
import React, { useCallback, useMemo } from 'react';

import DateTimeCell from 'apps/dashboard/components/table/DateTimeCell';
import TablePage, { DEFAULT_TABLE_OPTIONS } from 'apps/dashboard/components/table/TablePage';
import { useApiKeys } from 'apps/dashboard/features/keys/api/useApiKeys';
import { useRevokeKey } from 'apps/dashboard/features/keys/api/useRevokeKey';
import { useCreateKey } from 'apps/dashboard/features/keys/api/useCreateKey';
import confirm from 'components/confirm/confirm';
import prompt from 'components/prompt/prompt';
import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';

export const Component = () => {
    const { api } = useApi();
    const { data, isLoading } = useApiKeys();
    const keys = useMemo(() => (
        data?.Items || []
    ), [ data ]);
    const revokeKey = useRevokeKey();
    const createKey = useCreateKey();
    const theme = useTheme();

    const columns = useMemo<MRT_ColumnDef<AuthenticationInfo>[]>(() => [
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
            accessorFn: item => item.DateCreated ? parseISO(item.DateCreated) : undefined,
            Cell: DateTimeCell,
            header: globalize.translate('HeaderDateIssued'),
            filterVariant: 'datetime-range'
        }
    ], []);

    // NOTE: We need to provide a custom theme due to a MRT bug causing the initial theme to always be used
    // https://github.com/KevinVandy/material-react-table/issues/1429
    const mrtTheme = useMemo<Partial<MRT_Theme>>(() => ({
        baseBackgroundColor: theme.palette.background.paper
    }), [ theme ]);

    const table = useMaterialReactTable({
        ...DEFAULT_TABLE_OPTIONS,
        mrtTheme,

        columns,
        data: keys,

        state: {
            isLoading
        },

        // Enable (delete) row actions
        enableRowActions: true,
        positionActionsColumn: 'last',
        displayColumnDefOptions: {
            'mrt-row-actions': {
                header: '',
                size: 25
            }
        },

        renderTopToolbarCustomActions: () => (
            <Button
                startIcon={<AddIcon />}
                onClick={showNewKeyPopup}
            >
                {globalize.translate('HeaderNewApiKey')}
            </Button>
        ),

        renderRowActions: ({ row }) => {
            return (
                <Box sx={{ display: 'flex' }}>
                    <Tooltip title={globalize.translate('ButtonRevoke')}>
                        <IconButton
                            color='error'
                            // eslint-disable-next-line react/jsx-no-bind
                            onClick={() => row.original?.AccessToken && onRevokeKey(row.original.AccessToken)}
                        >
                            <DeleteIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            );
        }
    });

    const onRevokeKey = useCallback((accessToken: string) => {
        if (!api) return;

        confirm(globalize.translate('MessageConfirmRevokeApiKey'), globalize.translate('HeaderConfirmRevokeApiKey')).then(function () {
            revokeKey.mutate({
                key: accessToken
            });
        }).catch(err => {
            console.error('[apikeys] failed to show confirmation dialog', err);
        });
    }, [api, revokeKey]);

    const showNewKeyPopup = useCallback(() => {
        if (!api) return;

        prompt({
            title: globalize.translate('HeaderNewApiKey'),
            label: globalize.translate('LabelAppName'),
            description: globalize.translate('LabelAppNameExample')
        }).then((value) => {
            createKey.mutate({
                app: value
            });
        }).catch(() => {
            // popup closed
        });
    }, [api, createKey]);

    return (
        <TablePage
            id='apiKeysPage'
            title={globalize.translate('HeaderApiKeys')}
            subtitle={globalize.translate('HeaderApiKeysHelp')}
            className='mainAnimatedPage type-interior'
            table={table}
        />
    );
};

Component.displayName = 'ApiKeysPage';
