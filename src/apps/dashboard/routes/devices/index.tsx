import type { DeviceInfoDto } from '@jellyfin/sdk/lib/generated-client/models/device-info-dto';
import Delete from '@mui/icons-material/Delete';
import Edit from '@mui/icons-material/Edit';
import Box from '@mui/material/Box/Box';
import Button from '@mui/material/Button/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip/Tooltip';
import parseISO from 'date-fns/parseISO';
import {
    type MRT_ColumnDef,
    useMaterialReactTable
} from 'material-react-table';
import React, { useCallback, useMemo, useState } from 'react';

import DateTimeCell from 'apps/dashboard/components/table/DateTimeCell';
import TablePage, {
    DEFAULT_TABLE_OPTIONS
} from 'apps/dashboard/components/table/TablePage';
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

const getUserCell = (users: UsersRecords) =>
    function UserCell({ renderedCellValue, row }: DeviceInfoCell) {
        return (
            <>
                <UserAvatarButton
                    user={
                        (row.original.LastUserId &&
                            users[row.original.LastUserId]) ||
                        undefined
                    }
                    sx={{ mr: '1rem' }}
                />
                {renderedCellValue}
            </>
        );
    };

export const Component = () => {
    const { api } = useApi();
    const { data, isLoading: isDevicesLoading, isRefetching } = useDevices({});
    const devices = useMemo(() => data?.Items || [], [data]);
    const {
        usersById: users,
        names: userNames,
        isLoading: isUsersLoading
    } = useUsersDetails();

    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isDeleteAllConfirmOpen, setIsDeleteAllConfirmOpen] = useState(false);
    const [pendingDeleteDeviceId, setPendingDeleteDeviceId] =
        useState<string>();
    const deleteDevice = useDeleteDevice();
    const updateDevice = useUpdateDevice();

    const isLoading = isDevicesLoading || isUsersLoading;

    const onDeleteDevice = useCallback(
        (id: string | null | undefined) => () => {
            if (id) {
                setPendingDeleteDeviceId(id);
                setIsDeleteConfirmOpen(true);
            }
        },
        []
    );

    const onCloseDeleteConfirmDialog = useCallback(() => {
        setPendingDeleteDeviceId(undefined);
        setIsDeleteConfirmOpen(false);
    }, []);

    const onConfirmDelete = useCallback(() => {
        if (pendingDeleteDeviceId) {
            deleteDevice.mutate(
                {
                    id: pendingDeleteDeviceId
                },
                {
                    onSettled: onCloseDeleteConfirmDialog
                }
            );
        }
    }, [deleteDevice, onCloseDeleteConfirmDialog, pendingDeleteDeviceId]);

    const onDeleteAll = useCallback(() => {
        setIsDeleteAllConfirmOpen(true);
    }, []);

    const onCloseDeleteAllConfirmDialog = useCallback(() => {
        setIsDeleteAllConfirmOpen(false);
    }, []);

    const onConfirmDeleteAll = useCallback(() => {
        if (devices) {
            Promise.all(
                devices.map((item) => {
                    if (api && item.Id && api.deviceInfo.id === item.Id) {
                        return deleteDevice.mutateAsync({ id: item.Id });
                    }
                    return Promise.resolve();
                })
            )
                .catch((err) => {
                    console.error(
                        '[DevicesPage] failed deleting all devices',
                        err
                    );
                })
                .finally(() => {
                    onCloseDeleteAllConfirmDialog();
                });
        }
    }, [api, deleteDevice, devices, onCloseDeleteAllConfirmDialog]);

    const UserCell = getUserCell(users);

    const columns = useMemo<MRT_ColumnDef<DeviceInfoDto>[]>(
        () => [
            {
                id: 'DateLastActivity',
                accessorFn: (row) =>
                    row.DateLastActivity
                        ? parseISO(row.DateLastActivity)
                        : undefined,
                header: globalize.translate('LastActive'),
                size: 160,
                Cell: DateTimeCell,
                filterVariant: 'datetime-range',
                enableEditing: false
            },
            {
                id: 'Name',
                accessorFn: (row) => row.CustomName || row.Name,
                header: globalize.translate('LabelDevice'),
                size: 200,
                Cell: DeviceNameCell
            },
            {
                id: 'App',
                accessorFn: (row) =>
                    [row.AppName, row.AppVersion]
                        .filter((v) => !!v) // filter missing values
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
        ],
        [UserCell, userNames]
    );

    const mrTable = useMaterialReactTable({
        ...DEFAULT_TABLE_OPTIONS,

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

        // Editing device name
        enableEditing: true,
        onEditingRowSave: ({ table, row, values }) => {
            const newName = values.Name?.trim();
            const hasChanged = row.original.CustomName
                ? newName !== row.original.CustomName
                : newName !== row.original.Name;

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
                header: ''
            }
        },
        renderRowActions: ({ row, table }) => {
            const isDeletable =
                api && row.original.Id && api.deviceInfo.id === row.original.Id;
            return (
                <Box sx={{ display: 'flex', gap: 1 }}>
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
                        <IconButton color='error' disabled>
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
        renderTopToolbarCustomActions: () => (
            <Button color='error' startIcon={<Delete />} onClick={onDeleteAll}>
                {globalize.translate('DeleteAll')}
            </Button>
        )
    });

    return (
        <TablePage
            id='devicesPage'
            title={globalize.translate('HeaderDevices')}
            className='mainAnimatedPage type-interior'
            table={mrTable}
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
                open={isDeleteAllConfirmOpen}
                title={globalize.translate('HeaderDeleteDevices')}
                text={globalize.translate('DeleteDevicesConfirmation')}
                onCancel={onCloseDeleteAllConfirmDialog}
                onConfirm={onConfirmDeleteAll}
                confirmButtonColor='error'
                confirmButtonText={globalize.translate('Delete')}
            />
        </TablePage>
    );
};

Component.displayName = 'DevicesPage';
