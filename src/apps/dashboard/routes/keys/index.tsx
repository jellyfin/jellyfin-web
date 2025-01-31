import parseISO from 'date-fns/parseISO';

import DateTimeCell from 'apps/dashboard/components/table/DateTimeCell';
import Page from 'components/Page';
import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';
import React, { useCallback, useMemo } from 'react';
import type { AuthenticationInfo } from '@jellyfin/sdk/lib/generated-client/models/authentication-info';
import confirm from 'components/confirm/confirm';
import { useApiKeys } from 'apps/dashboard/features/keys/api/useApiKeys';
import { useRevokeKey } from 'apps/dashboard/features/keys/api/useRevokeKey';
import { useCreateKey } from 'apps/dashboard/features/keys/api/useCreateKey';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { MaterialReactTable, MRT_ColumnDef, useMaterialReactTable } from 'material-react-table';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

const ApiKeys = () => {
    const { api } = useApi();
    const { data: keys, isLoading } = useApiKeys();
    const revokeKey = useRevokeKey();
    const createKey = useCreateKey();

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

    const table = useMaterialReactTable({
        columns,
        data: keys?.Items || [],

        state: {
            isLoading
        },

        rowCount: keys?.TotalRecordCount || 0,

        enableColumnPinning: true,
        enableColumnResizing: true,

        enableStickyFooter: true,
        enableStickyHeader: true,
        muiTableContainerProps: {
            sx: {
                maxHeight: 'calc(100% - 7rem)' // 2 x 3.5rem for header and footer
            }
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

        import('../../../../components/prompt/prompt').then(({ default: prompt }) => {
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
        }).catch(err => {
            console.error('[apikeys] failed to load api key popup', err);
        });
    }, [api, createKey]);

    return (
        <Page
            id='apiKeysPage'
            title={globalize.translate('HeaderApiKeys')}
            className='mainAnimatedPage type-interior'
        >
            <Box
                className='content-primary'
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%'
                }}
            >
                <Box
                    sx={{
                        marginBottom: 1
                    }}
                >
                    <Stack spacing={2}>
                        <Typography variant='h2'>
                            {globalize.translate('HeaderApiKeys')}
                        </Typography>
                        <Typography>{globalize.translate('HeaderApiKeysHelp')}</Typography>
                    </Stack>
                </Box>
                <MaterialReactTable table={table} />
            </Box>
        </Page>
    );
};

export default ApiKeys;
