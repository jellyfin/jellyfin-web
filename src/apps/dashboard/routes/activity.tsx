import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { ActivityLogEntry } from '@jellyfin/sdk/lib/generated-client/models/activity-log-entry';
import { LogLevel } from '@jellyfin/sdk/lib/generated-client/models/log-level';
import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import Box from '@mui/material/Box';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { type MRT_ColumnDef, MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import { useSearchParams } from 'react-router-dom';

import { useLogEntires } from 'apps/dashboard/features/activity/api/useLogEntries';
import ActionsCell from 'apps/dashboard/features/activity/components/ActionsCell';
import LogLevelCell from 'apps/dashboard/features/activity/components/LogLevelCell';
import OverviewCell from 'apps/dashboard/features/activity/components/OverviewCell';
import UserAvatarButton from 'apps/dashboard/features/activity/components/UserAvatarButton';
import type { ActivityLogEntryCell } from 'apps/dashboard/features/activity/types/ActivityLogEntryCell';
import Page from 'components/Page';
import { useUsers } from 'hooks/useUsers';
import { parseISO8601Date, toLocaleString } from 'scripts/datetime';
import globalize from 'lib/globalize';
import { toBoolean } from 'utils/string';

type UsersRecords = Record<string, UserDto>;

const DEFAULT_PAGE_SIZE = 25;
const VIEW_PARAM = 'useractivity';

const enum ActivityView {
    All = 'All',
    User = 'User',
    System = 'System'
}

const getActivityView = (param: string | null) => {
    if (param === null) return ActivityView.All;
    if (toBoolean(param)) return ActivityView.User;
    return ActivityView.System;
};

const getUserCell = (users: UsersRecords) => function UserCell({ row }: ActivityLogEntryCell) {
    return (
        <UserAvatarButton user={row.original.UserId && users[row.original.UserId] || undefined} />
    );
};

const Activity = () => {
    const [ searchParams, setSearchParams ] = useSearchParams();

    const [ activityView, setActivityView ] = useState(
        getActivityView(searchParams.get(VIEW_PARAM)));

    const [ pagination, setPagination ] = useState({
        pageIndex: 0,
        pageSize: DEFAULT_PAGE_SIZE
    });

    const { data: usersData, isLoading: isUsersLoading } = useUsers();

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

    const userNames = useMemo(() => {
        const names: string[] = [];
        usersData?.forEach(user => {
            if (user.Name) names.push(user.Name);
        });
        return names;
    }, [ usersData ]);

    const UserCell = getUserCell(users);

    const activityParams = useMemo(() => ({
        startIndex: pagination.pageIndex * pagination.pageSize,
        limit: pagination.pageSize,
        hasUserId: activityView !== ActivityView.All ? activityView === ActivityView.User : undefined
    }), [activityView, pagination.pageIndex, pagination.pageSize]);

    const { data: logEntries, isLoading: isLogEntriesLoading } = useLogEntires(activityParams);

    const isLoading = isUsersLoading || isLogEntriesLoading;

    const userColumn: MRT_ColumnDef<ActivityLogEntry>[] = useMemo(() =>
        (activityView === ActivityView.System) ? [] : [{
            id: 'User',
            accessorFn: row => row.UserId && users[row.UserId]?.Name,
            header: globalize.translate('LabelUser'),
            size: 75,
            Cell: UserCell,
            enableResizing: false,
            muiTableBodyCellProps: {
                align: 'center'
            },
            filterVariant: 'multi-select',
            filterSelectOptions: userNames
        }], [ activityView, userNames, users, UserCell ]);

    const columns = useMemo<MRT_ColumnDef<ActivityLogEntry>[]>(() => [
        {
            id: 'Date',
            accessorFn: row => parseISO8601Date(row.Date),
            header: globalize.translate('LabelTime'),
            size: 160,
            Cell: ({ cell }) => toLocaleString(cell.getValue<Date>()),
            filterVariant: 'datetime-range'
        },
        {
            accessorKey: 'Severity',
            header: globalize.translate('LabelLevel'),
            size: 90,
            Cell: LogLevelCell,
            enableResizing: false,
            muiTableBodyCellProps: {
                align: 'center'
            },
            filterVariant: 'multi-select',
            filterSelectOptions: Object.values(LogLevel).map(level => globalize.translate(`LogLevel.${level}`))
        },
        ...userColumn,
        {
            accessorKey: 'Name',
            header: globalize.translate('LabelName'),
            size: 270
        },
        {
            id: 'Overview',
            accessorFn: row => row.ShortOverview || row.Overview,
            header: globalize.translate('LabelOverview'),
            size: 170,
            Cell: OverviewCell
        },
        {
            accessorKey: 'Type',
            header: globalize.translate('LabelType'),
            size: 150
        },
        {
            id: 'Actions',
            accessorFn: row => row.ItemId,
            header: '',
            size: 60,
            Cell: ActionsCell,
            enableColumnActions: false,
            enableColumnFilter: false,
            enableResizing: false,
            enableSorting: false
        }
    ], [ userColumn ]);

    const onViewChange = useCallback((_e: React.MouseEvent<HTMLElement, MouseEvent>, newView: ActivityView | null) => {
        if (newView !== null) {
            setActivityView(newView);
        }
    }, []);

    useEffect(() => {
        const currentViewParam = getActivityView(searchParams.get(VIEW_PARAM));
        if (currentViewParam !== activityView) {
            if (activityView === ActivityView.All) {
                searchParams.delete(VIEW_PARAM);
            } else {
                searchParams.set(VIEW_PARAM, `${activityView === ActivityView.User}`);
            }
            setSearchParams(searchParams);
        }
    }, [ activityView, searchParams, setSearchParams ]);

    const table = useMaterialReactTable({
        columns,
        data: logEntries?.Items || [],

        // Enable custom features
        enableColumnPinning: true,
        enableColumnResizing: true,

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
            density: 'compact'
        },
        state: {
            isLoading,
            pagination
        },

        // Server pagination
        manualPagination: true,
        onPaginationChange: setPagination,
        rowCount: logEntries?.TotalRecordCount || 0,

        // Custom toolbar contents
        renderTopToolbarCustomActions: () => (
            <ToggleButtonGroup
                size='small'
                value={activityView}
                onChange={onViewChange}
                exclusive
            >
                <ToggleButton value={ActivityView.All}>
                    {globalize.translate('All')}
                </ToggleButton>
                <ToggleButton value={ActivityView.User}>
                    {globalize.translate('LabelUser')}
                </ToggleButton>
                <ToggleButton value={ActivityView.System}>
                    {globalize.translate('LabelSystem')}
                </ToggleButton>
            </ToggleButtonGroup>
        )
    });

    return (
        <Page
            id='serverActivityPage'
            title={globalize.translate('HeaderActivity')}
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
                    <Typography variant='h2'>
                        {globalize.translate('HeaderActivity')}
                    </Typography>
                </Box>
                <MaterialReactTable table={table} />
            </Box>
        </Page>
    );
};

export default Activity;
