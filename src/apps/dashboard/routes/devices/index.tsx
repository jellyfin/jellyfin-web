import type { DeviceInfoDto } from '@jellyfin/sdk/lib/generated-client/models/device-info-dto';
import Delete from '@mui/icons-material/Delete';
import Edit from '@mui/icons-material/Edit';
import Box from '@mui/material/Box/Box';
import Button from '@mui/material/Button/Button';
import IconButton from '@mui/material/IconButton/IconButton';
import Tooltip from '@mui/material/Tooltip/Tooltip';
import React, { useMemo } from 'react';

import TablePage from 'apps/dashboard/components/TablePage';
import { useDevices } from 'apps/dashboard/features/devices/api/useDevices';
import globalize from 'lib/globalize';
import { type MRT_ColumnDef, useMaterialReactTable } from 'material-react-table';
import { parseISO8601Date, toLocaleString } from 'scripts/datetime';
import { useApi } from 'hooks/useApi';
import { getDeviceIcon } from 'utils/image';
import UserAvatarButton from 'apps/dashboard/features/activity/components/UserAvatarButton';
import { useUsers } from 'hooks/useUsers';
import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';

type UsersRecords = Record<string, UserDto>;

const DevicesPage = () => {
    const { api } = useApi();
    const { data: devices, isLoading: isDevicesLoading } = useDevices({});
    const { data: usersData, isLoading: isUsersLoading } = useUsers();

    const isLoading = isDevicesLoading || isUsersLoading;

    const users: UsersRecords = useMemo(() => {
        if (!usersData) return {};

        return usersData.reduce<UsersRecords>((acc, user) => {
            const userId = user.Id;
            if (!userId) return acc;

            return {
                ...acc,
                [userId]: user
            };
        }, {});
    }, [ usersData ]);

    const columns = useMemo<MRT_ColumnDef<DeviceInfoDto>[]>(() => [
        {
            id: 'DateLastActivity',
            accessorFn: row => parseISO8601Date(row.DateLastActivity),
            header: globalize.translate('LabelTime'),
            size: 160,
            Cell: ({ cell }) => toLocaleString(cell.getValue<Date>()),
            filterVariant: 'datetime-range',
            enableEditing: false
        },
        {
            id: 'Name',
            accessorFn: row => row.CustomName || row.Name,
            header: globalize.translate('LabelDevice'),
            size: 200,
            Cell: ({ row, renderedCellValue }) => (
                <>
                    <img
                        alt={row.original.AppName || undefined}
                        src={getDeviceIcon(row.original)}
                        style={{
                            display: 'inline-block',
                            maxWidth: '1.5em',
                            maxHeight: '1.5em',
                            marginRight: '1rem'
                        }}
                    />
                    {renderedCellValue}
                </>
            )
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
            Cell: ({ row, renderedCellValue }) => (
                <>
                    <UserAvatarButton user={row.original.LastUserId && users[row.original.LastUserId] || undefined} />
                    {renderedCellValue}
                </>
            )
        }
    ], [ users ]);

    const mrTable = useMaterialReactTable({
        columns,
        data: devices?.Items || [],

        // Enable custom features
        enableColumnPinning: true,
        enableColumnResizing: true,
        enableEditing: true,

        // Sticky header/footer
        enableStickyFooter: true,
        enableStickyHeader: true,
        muiTableContainerProps: {
            sx: {
                maxHeight: 'calc(100% - 7rem)' // 2 x 3.5rem for header and footer
            }
        },

        // State
        initialState: {
            pagination: {
                pageIndex: 0,
                pageSize: 25
            }
        },
        state: {
            isLoading
        },

        // Custom actions
        enableRowActions: true,
        positionActionsColumn: 'last',
        renderRowActions: ({ row, table }) => (
            <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title={globalize.translate('Edit')}>
                    <IconButton
                        onClick={() => table.setEditingRow(row)}
                    >
                        <Edit />
                    </IconButton>
                </Tooltip>
                <Tooltip title={globalize.translate('Delete')}>
                    <IconButton
                        color='error'
                        disabled={api && api.deviceInfo.id === row.original.Id}
                    >
                        <Delete />
                    </IconButton>
                </Tooltip>
            </Box>
        ),

        // Custom toolbar contents
        renderTopToolbarCustomActions: () => (
            <Button color='error'>{globalize.translate('DeleteAll')}</Button>
        )
    });

    return (
        <TablePage
            id='devicesPage'
            title={globalize.translate('HeaderDevices')}
            className='mainAnimatedPage type-interior'
            table={mrTable}
        />
    );
};

export default DevicesPage;
