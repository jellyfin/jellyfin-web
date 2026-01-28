/**
 * @deprecated This route is mostly migrated but uses legacy table patterns.
 *
 * Migration:
 * - Uses TanStack Table (already migrated)
 * - Replace TablePage wrapper with DataTable component
 *
 * @see src/styles/LEGACY_DEPRECATION_GUIDE.md
 */

import type { DeviceInfoDto } from '@jellyfin/sdk/lib/generated-client/models/device-info-dto';
import { parseISO } from 'date-fns';
import React, { useCallback, useMemo, useState } from 'react';
import { vars } from 'styles/tokens.css';
import type { CellContext } from '@tanstack/react-table';

import DateTimeCell from 'apps/dashboard/components/table/DateTimeCell';
import TablePage from 'apps/dashboard/components/table/TablePage';
import UserAvatarButton from 'apps/dashboard/components/UserAvatarButton';
import { useDeleteDevice } from 'apps/dashboard/features/devices/api/useDeleteDevice';
import { useDevices } from 'apps/dashboard/features/devices/api/useDevices';
import { useUpdateDevice } from 'apps/dashboard/features/devices/api/useUpdateDevice';
import DeviceNameCell from 'apps/dashboard/features/devices/components/DeviceNameCell';
import ConfirmDialog from 'components/ConfirmDialog';
import { useApi } from 'hooks/useApi';
import { type UsersRecords, useUsersDetails } from 'hooks/useUsers';
import globalize from 'lib/globalize';
import { Flex } from 'ui-primitives/Box';
import { Button } from 'ui-primitives/Button';
import { IconButton } from 'ui-primitives/IconButton';
import { Tooltip } from 'ui-primitives/Tooltip';
import type { ColumnDef } from '@tanstack/react-table';

const DeleteIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
    </svg>
);

const EditIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
    </svg>
);

const getUserCell = (users: UsersRecords) =>
    function UserCell({ row }: CellContext<DeviceInfoDto, unknown>) {
        return (
            <Flex style={{ alignItems: 'center' }}>
                <UserAvatarButton
                    user={(row.original.LastUserId && users[row.original.LastUserId]) || undefined}
                    style={{ marginRight: '16px' }}
                />
                {row.original.LastUserName}
            </Flex>
        );
    };

export const Component = () => {
    const { api } = useApi();
    const { data, isLoading: isDevicesLoading } = useDevices({});
    const devices = useMemo(() => data?.Items || [], [data]);
    const { usersById: users, isLoading: isUsersLoading } = useUsersDetails();

    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isDeleteAllConfirmOpen, setIsDeleteAllConfirmOpen] = useState(false);
    const [pendingDeleteDeviceId, setPendingDeleteDeviceId] = useState<string>();
    const deleteDevice = useDeleteDevice();
    const updateDevice = useUpdateDevice();

    const isLoading = isDevicesLoading || isUsersLoading;

    const onDeleteDevice = useCallback(
        (id: string | undefined) => () => {
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
                devices.map(item => {
                    if (api && item.Id && api.deviceInfo.id === item.Id) {
                        return deleteDevice.mutateAsync({ id: item.Id });
                    }
                    return Promise.resolve();
                })
            )
                .catch(err => {
                    console.error('[DevicesPage] failed deleting all devices', err);
                })
                .finally(() => {
                    onCloseDeleteAllConfirmDialog();
                });
        }
    }, [api, deleteDevice, devices, onCloseDeleteAllConfirmDialog]);

    const UserCell = getUserCell(users);

    const columns = useMemo<ColumnDef<DeviceInfoDto>[]>(
        () => [
            {
                id: 'DateLastActivity',
                accessorFn: row => (row.DateLastActivity ? parseISO(row.DateLastActivity) : undefined),
                header: globalize.translate('LastActive'),
                size: 160,
                cell: DateTimeCell,
                enableResizing: false
            },
            {
                id: 'Name',
                accessorFn: row => row.CustomName || row.Name,
                header: globalize.translate('LabelDevice'),
                size: 200,
                cell: DeviceNameCell
            },
            {
                id: 'App',
                accessorFn: row => [row.AppName, row.AppVersion].filter(v => !!v).join(' '),
                header: globalize.translate('LabelAppName'),
                size: 200,
                enableResizing: false
            },
            {
                accessorKey: 'LastUserName',
                header: globalize.translate('LabelUser'),
                size: 120,
                cell: UserCell,
                enableResizing: false
            }
        ],
        [UserCell]
    );

    const renderRowActions = useCallback(
        (row: DeviceInfoDto) => {
            const isDeletable = api && row.Id && api.deviceInfo.id !== row.Id;
            return (
                <Flex
                    style={{
                        display: 'flex',
                        gap: vars.spacing['2'],
                        backgroundColor: 'transparent'
                    }}
                >
                    <Tooltip title={globalize.translate('Edit')}>
                        <IconButton
                            onClick={() => {
                                const customName = row.CustomName || row.Name || '';
                                const newName = window.prompt(globalize.translate('LabelDevice'), customName);
                                const deviceId = row.Id;
                                if (newName && newName !== customName && deviceId) {
                                    updateDevice.mutate({
                                        id: deviceId,
                                        deviceOptionsDto: { CustomName: newName }
                                    });
                                }
                            }}
                        >
                            <EditIcon />
                        </IconButton>
                    </Tooltip>
                    {isDeletable ? (
                        <Tooltip title={globalize.translate('Delete')}>
                            <IconButton color="danger" onClick={onDeleteDevice(row.Id || undefined)}>
                                <DeleteIcon />
                            </IconButton>
                        </Tooltip>
                    ) : (
                        <IconButton color="danger" disabled>
                            <DeleteIcon />
                        </IconButton>
                    )}
                </Flex>
            );
        },
        [api, onDeleteDevice, updateDevice]
    );

    const renderToolbar = useCallback(
        () => (
            <Button variant="error" startDecorator={<DeleteIcon />} onClick={onDeleteAll}>
                {globalize.translate('DeleteAll')}
            </Button>
        ),
        [onDeleteAll]
    );

    return (
        <TablePage
            id="devicesPage"
            title={globalize.translate('HeaderDevices')}
            className="mainAnimatedPage type-interior"
            data={devices}
            columns={columns}
            isLoading={isLoading}
            enableColumnResizing={true}
            enableRowActions={true}
            renderRowActions={renderRowActions}
            renderToolbar={renderToolbar}
        >
            <ConfirmDialog
                open={isDeleteConfirmOpen}
                title={globalize.translate('HeaderDeleteDevice')}
                message={globalize.translate('DeleteDeviceConfirmation')}
                onCancel={onCloseDeleteConfirmDialog}
                onConfirm={onConfirmDelete}
                isDestructive={true}
                confirmText={globalize.translate('Delete')}
            />
            <ConfirmDialog
                open={isDeleteAllConfirmOpen}
                title={globalize.translate('HeaderDeleteDevices')}
                message={globalize.translate('DeleteDevicesConfirmation')}
                onCancel={onCloseDeleteAllConfirmDialog}
                onConfirm={onConfirmDeleteAll}
                isDestructive={true}
                confirmText={globalize.translate('Delete')}
            />
        </TablePage>
    );
};

Component.displayName = 'DevicesPage';
