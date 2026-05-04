import type { DeviceInfoDto } from '@jellyfin/sdk/lib/generated-client/models/device-info-dto';
import Delete from '@mui/icons-material/Delete';
import Edit from '@mui/icons-material/Edit';
import Box from '@mui/material/Box/Box';
import Button from '@mui/material/Button/Button';
import IconButton from '@mui/material/IconButton';
import { useTheme } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip/Tooltip';
import parseISO from 'date-fns/parseISO';
import { type MRT_ColumnDef, type MRT_Theme, useMaterialReactTable } from 'material-react-table';
import React, { useCallback, useMemo, useState } from 'react';

import DateTimeCell from 'apps/dashboard/components/table/DateTimeCell';
import TablePage, { DEFAULT_TABLE_OPTIONS } from 'apps/dashboard/components/table/TablePage';
import UserAvatarButton from 'apps/dashboard/components/UserAvatarButton';
import { useDeleteDevice } from 'apps/dashboard/features/devices/api/useDeleteDevice';
import { useDevices } from 'apps/dashboard/features/devices/api/useDevices';
import { useUpdateDevice } from 'apps/dashboard/features/devices/api/useUpdateDevice';
import DeviceNameCell from 'apps/dashboard/features/devices/components/DeviceNameCell';
import type { DeviceInfoCell } from 'apps/dashboard/features/devices/types/deviceInfoCell';
import ConfirmDialog from 'components/ConfirmDialog';
import { useApi } from 'hooks/useApi';
import { type UsersRecords, useUsersDetails } from 'hooks/useUsers';
import globalize from 'lib/globalize';

const getUserCell = (users: UsersRecords) => function UserCell({ renderedCellValue, row }: DeviceInfoCell) {
    return (
        <>
            <UserAvatarButton
                user={row.original.LastUserId && users[row.original.LastUserId] || undefined}
                sx={{ mr: '1rem' }}
            />
            {renderedCellValue}
        </>
    );
};

export const Component = () => {
    const { api } = useApi();
    const {
        data,
        isLoading: isDevicesLoading,
        isError: isDevicesError,
        isRefetching
    } = useDevices({});
    const devices = useMemo(() => (
        data?.Items || []
    ), [ data ]);
    const {
        usersById: users,
        names: userNames,
        isLoading: isUsersLoading,
        isError: isUsersError
    } = useUsersDetails();
    const theme = useTheme();

    const [ isDeleteConfirmOpen, setIsDeleteConfirmOpen ] = useState(false);
    const [ isDeleteSelectedConfirmOpen, setIsDeleteSelectedConfirmOpen ] = useState(false);
    const [ isDeleteCurrentSessionConfirmOpen, setIsDeleteCurrentSessionConfirmOpen ] = useState(false);
    const [ pendingDeleteDeviceId, setPendingDeleteDeviceId ] = useState<string>();
    const deleteDevice = useDeleteDevice();
    const updateDevice = useUpdateDevice();

    const isLoading = isDevicesLoading || isUsersLoading;

    const onDeleteDevice = useCallback((id: string | null | undefined) => () => {
        if (id) {
            setPendingDeleteDeviceId(id);
            setIsDeleteConfirmOpen(true);
        }
    }, []);

    const onCloseDeleteConfirmDialog = useCallback(() => {
        setPendingDeleteDeviceId(undefined);
        setIsDeleteConfirmOpen(false);
    }, []);

    const onConfirmDelete = useCallback(() => {
        if (pendingDeleteDeviceId) {
            deleteDevice.mutate({
                id: pendingDeleteDeviceId
            }, {
                onSettled: onCloseDeleteConfirmDialog
            });
        }
    }, [ deleteDevice, onCloseDeleteConfirmDialog, pendingDeleteDeviceId ]);

    const onOpenDeleteSelectedConfirmDialog = useCallback(() => {
        setIsDeleteSelectedConfirmOpen(true);
    }, []);

    const onCloseDeleteSelectedConfirmDialog = useCallback(() => {
        setIsDeleteSelectedConfirmOpen(false);
    }, []);

    const onOpenDeleteCurrentSessionConfirmDialog = useCallback(() => {
        setIsDeleteCurrentSessionConfirmOpen(true);
    }, []);

    const onCloseDeleteCurrentSessionConfirmDialog = useCallback(() => {
        setIsDeleteCurrentSessionConfirmOpen(false);
    }, []);

    const UserCell = getUserCell(users);

    const columns = useMemo<MRT_ColumnDef<DeviceInfoDto>[]>(() => [
        {
            id: 'DateLastActivity',
            accessorFn: row => row.DateLastActivity ? parseISO(row.DateLastActivity) : undefined,
            header: globalize.translate('LastActive'),
            size: 160,
            Cell: DateTimeCell,
            filterVariant: 'datetime-range',
            enableEditing: false
        },
        {
            id: 'Name',
            accessorFn: row => row.CustomName || row.Name,
            header: globalize.translate('LabelDevice'),
            size: 200,
            Cell: DeviceNameCell
        },
        {
            id: 'App',
            accessorFn: row => [row.AppName, row.AppVersion]
                .filter(v => !!v) // filter missing values
                .join(' '),
            header: globalize.translate('LabelAppName'),
            size: 200,
            enableEditing: false
        },
        {
            accessorKey: 'LastUserName',
            header: globalize.translate('LabelUser'),
            size: 120,
            enableEditing: false,
            Cell: UserCell,
            filterVariant: 'multi-select',
            filterSelectOptions: userNames
        }
    ], [ UserCell, userNames ]);

    // NOTE: We need to provide a custom theme due to a MRT bug causing the initial theme to always be used
    // https://github.com/KevinVandy/material-react-table/issues/1429
    const mrtTheme = useMemo<Partial<MRT_Theme>>(() => ({
        baseBackgroundColor: theme.palette.background.paper
    }), [ theme ]);

    const mrTable = useMaterialReactTable({
        ...DEFAULT_TABLE_OPTIONS,
        mrtTheme,

        columns,
        data: devices,

        // State
        initialState: {
            density: 'compact',
            pagination: {
                pageIndex: 0,
                pageSize: 25
            }
        },
        state: {
            isLoading
        },

        // Do not reset the page index when refetching data
        autoResetPageIndex: !isRefetching,

        enableRowSelection: row => row.original.Id !== api?.deviceInfo.id,
        enableMultiRowSelection: true,

        // Editing device name
        enableEditing: true,
        onEditingRowSave: ({ table, row, values }) => {
            const newName = values.Name?.trim();
            const hasChanged = row.original.CustomName ?
                newName !== row.original.CustomName :
                newName !== row.original.Name;

            // If the name has changed, save it as the custom name
            if (row.original.Id && hasChanged) {
                updateDevice.mutate({
                    id: row.original.Id,
                    deviceOptionsDto: {
                        CustomName: newName || undefined
                    }
                });
            }

            table.setEditingRow(null); //exit editing mode
        },

        // Custom actions
        enableRowActions: true,
        positionActionsColumn: 'last',
        displayColumnDefOptions: {
            'mrt-row-actions': {
                header: '',
                size: 100
            }
        },
        renderRowActions: ({ row, table }) => {
            const isDeletable = api && row.original.Id && api.deviceInfo.id === row.original.Id;
            return (
                <Box
                    sx={{
                        display: 'flex',
                        gap: 1,
                        '&&': {
                            backgroundColor: 'transparent !important'
                        }
                    }}
                >
                    <Tooltip title={globalize.translate('Edit')}>
                        <IconButton
                            // eslint-disable-next-line react/jsx-no-bind
                            onClick={() => table.setEditingRow(row)}
                        >
                            <Edit />
                        </IconButton>
                    </Tooltip>
                    {/* Don't include Tooltip when disabled */}
                    {isDeletable ? (
                        <IconButton
                            color='error'
                            disabled
                        >
                            <Delete />
                        </IconButton>
                    ) : (
                        <Tooltip title={globalize.translate('Delete')}>
                            <IconButton
                                color='error'
                                onClick={onDeleteDevice(row.original.Id)}
                            >
                                <Delete />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            );
        },

        // Custom toolbar contents
        renderTopToolbarCustomActions: ({ table }) => {
            const hasSelection = table.getSelectedRowModel().rows.length > 0;
            return (
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        color='error'
                        startIcon={<Delete />}
                        disabled={!hasSelection}
                        onClick={onOpenDeleteSelectedConfirmDialog}
                    >
                        {globalize.translate('DeleteSelected')}
                    </Button>
                    <Button
                        color='error'
                        startIcon={<Delete />}
                        onClick={onOpenDeleteCurrentSessionConfirmDialog}
                    >
                        {globalize.translate('DeleteCurrentSession')}
                    </Button>
                </Box>
            );
        }
    });

    const onConfirmDeleteSelected = useCallback(() => {
        const selectedRows = mrTable.getSelectedRowModel().rows;
        Promise.all(
            selectedRows.map(row =>
                row.original.Id ? deleteDevice.mutateAsync({ id: row.original.Id }) : Promise.resolve()
            )
        )
            .catch(err => console.error('[DevicesPage] failed deleting selected devices', err))
            .finally(() => {
                mrTable.resetRowSelection();
                setIsDeleteSelectedConfirmOpen(false);
            });
    }, [ mrTable, deleteDevice ]);

    const onConfirmDeleteCurrentSession = useCallback(() => {
        const currentId = api?.deviceInfo.id;
        if (currentId) {
            deleteDevice.mutate({ id: currentId }, {
                onSettled: () => setIsDeleteCurrentSessionConfirmOpen(false)
            });
        }
    }, [ api, deleteDevice ]);

    return (
        <TablePage
            id='devicesPage'
            title={globalize.translate('HeaderDevices')}
            className='mainAnimatedPage type-interior'
            table={mrTable}
            isError={isDevicesError || isUsersError}
            errorMessage={globalize.translate('DevicesLoadError')}
        >
            <ConfirmDialog
                open={isDeleteConfirmOpen}
                title={globalize.translate('HeaderDeleteDevice')}
                text={globalize.translate('DeleteDeviceConfirmation')}
                onCancel={onCloseDeleteConfirmDialog}
                onConfirm={onConfirmDelete}
                confirmButtonColor='error'
                confirmButtonText={globalize.translate('Delete')}
            />
            <ConfirmDialog
                open={isDeleteSelectedConfirmOpen}
                title={globalize.translate('HeaderDeleteSelectedDevices')}
                text={globalize.translate('DeleteSelectedDevicesConfirmation')}
                onCancel={onCloseDeleteSelectedConfirmDialog}
                onConfirm={onConfirmDeleteSelected}
                confirmButtonColor='error'
                confirmButtonText={globalize.translate('Delete')}
            />
            <ConfirmDialog
                open={isDeleteCurrentSessionConfirmOpen}
                title={globalize.translate('HeaderDeleteCurrentSession')}
                text={globalize.translate('DeleteCurrentSessionConfirmation')}
                onCancel={onCloseDeleteCurrentSessionConfirmDialog}
                onConfirm={onConfirmDeleteCurrentSession}
                confirmButtonColor='error'
                confirmButtonText={globalize.translate('Delete')}
            />
        </TablePage>
    );
};

Component.displayName = 'DevicesPage';
