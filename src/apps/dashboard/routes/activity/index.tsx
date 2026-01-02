import parseISO from 'date-fns/parseISO';
import React, { useCallback, useMemo, useState } from 'react';
import { LogLevel } from '@jellyfin/sdk/lib/generated-client/models/log-level';
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order';
import { useTheme } from '@mui/material/styles';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { type MRT_ColumnDef, type MRT_Theme, type MRT_ColumnFiltersState, type MRT_SortingState, useMaterialReactTable } from 'material-react-table';
import DateTimeCell from 'apps/dashboard/components/table/DateTimeCell';
import TablePage, { DEFAULT_TABLE_OPTIONS } from 'apps/dashboard/components/table/TablePage';
import { useLogEntries } from 'apps/dashboard/features/activity/api/useLogEntries';
import ActionsCell from 'apps/dashboard/features/activity/components/ActionsCell';
import LogLevelCell from 'apps/dashboard/features/activity/components/LogLevelCell';
import OverviewCell from 'apps/dashboard/features/activity/components/OverviewCell';
import UserAvatarButton from 'apps/dashboard/components/UserAvatarButton';
import type { ActivityLogEntryCell } from 'apps/dashboard/features/activity/types/ActivityLogEntryCell';
import { type UsersRecords, useUsersDetails } from 'hooks/useUsers';
import globalize from 'lib/globalize';
import type { ActivityLogEntry } from '@jellyfin/sdk/lib/generated-client/models/activity-log-entry';
import { ActivityLogSortBy } from '@jellyfin/sdk/lib/generated-client/models/activity-log-sort-by';

const DEFAULT_PAGE_SIZE = 25;

const enum ActivityView {
    All = 'All',
    User = 'User',
    System = 'System'
}

const getUserCell = (users: UsersRecords) => function UserCell({ row }: ActivityLogEntryCell) {
    return (
        <UserAvatarButton user={row.original.UserId && users[row.original.UserId] || undefined} />
    );
};

export const Component = () => {
    const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([]);
    const [activityView, setActivityView] = useState(
        'All');

    const [sorting, setSorting] = useState<MRT_SortingState>([{ id: 'Date', desc: true }]);

    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: DEFAULT_PAGE_SIZE
    });

    const { usersById: users, names: userNames, isLoading: isUsersLoading } = useUsersDetails();

    const theme = useTheme();

    const UserCell = getUserCell(users);

    const activityParams = useMemo(() => {
        const getFilter = (id: string) => columnFilters.find(f => f.id === id)?.value;
        const sortFields: ActivityLogSortBy[] = [];
        const sortOrders: SortOrder[] = [];

        const mapSortField = (id: string): ActivityLogSortBy => {
            switch (id) {
                case 'Date': return ActivityLogSortBy.DateCreated;
                case 'Severity': return ActivityLogSortBy.LogSeverity;
                case 'Name': return ActivityLogSortBy.Name;
                case 'Type': return ActivityLogSortBy.Type;
                case 'Overview': return ActivityLogSortBy.ShortOverview;
                case 'User': return ActivityLogSortBy.Username;
                default: return ActivityLogSortBy.DateCreated;
            }
        };

        if (sorting.length === 0) {
            sortFields.push(ActivityLogSortBy.DateCreated);
            sortOrders.push(SortOrder.Descending);
        } else {
            sorting.forEach(sort => {
                sortFields.push(mapSortField(sort.id));
                sortOrders.push(sort.desc ? SortOrder.Descending : SortOrder.Ascending);
            });
        }

        return {
            startIndex: pagination.pageIndex * pagination.pageSize,
            limit: pagination.pageSize,

            name: getFilter('Name') as string || undefined,
            type: getFilter('Type') as string || undefined,
            shortOverview: getFilter('Overview') as string || undefined,
            username: getFilter('User') as string || undefined,
            severity: getFilter('Severity') as LogLevel || undefined,
            minDate: (getFilter('Date') as string[] | undefined)?.[0] ?? undefined,
            maxDate: (getFilter('Date') as string[] | undefined)?.[1] ?? undefined,
            sortBy: sortFields,
            sortOrder: sortOrders
        };
    }, [pagination, columnFilters, sorting]);

    const { data, isLoading: isLogEntriesLoading } = useLogEntries(activityParams);
    const logEntries = useMemo(() => (
        data?.Items || []
    ), [data]);
    const rowCount = useMemo(() => (
        data?.TotalRecordCount || 0
    ), [data]);

    const isLoading = isUsersLoading || isLogEntriesLoading;

    const userColumn: MRT_ColumnDef<ActivityLogEntry>[] = useMemo(() =>
        (activityView === ActivityView.System) ? [] : [{
            id: 'User',
            accessorFn: row => row.UserId && users[row.UserId]?.Name,
            header: globalize.translate('LabelUser'),
            size: 100,
            Cell: UserCell,
            enableResizing: false,
            muiTableBodyCellProps: {
                align: 'center'
            },
            filterVariant: 'select',
            filterSelectOptions: userNames
        }], [activityView, userNames, users, UserCell]);

    const columns = useMemo<MRT_ColumnDef<ActivityLogEntry>[]>(() => [
        {
            id: 'Date',
            accessorFn: row => row.Date ? parseISO(row.Date) : undefined,
            header: globalize.translate('LabelTime'),
            size: 160,
            Cell: DateTimeCell,
            filterVariant: 'datetime-range',
            grow: true,
            maxSize: 320
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
            filterVariant: 'select',
            filterSelectOptions: Object.values(LogLevel).map(level => ({
                text: globalize.translate(`LogLevel.${level}`),
                value: level
            }))
        },
        ...userColumn,
        {
            accessorKey: 'Name',
            header: globalize.translate('LabelName'),
            size: 270,
            grow: true
        },
        {
            id: 'Overview',
            accessorFn: row => row.ShortOverview || row.Overview,
            header: globalize.translate('LabelOverview'),
            size: 170,
            Cell: OverviewCell,
            grow: true,
            maxSize: 220
        },
        {
            accessorKey: 'Type',
            header: globalize.translate('LabelType'),
            size: 150,
            grow: true,
            maxSize: 220
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
    ], [userColumn]);

    const onViewChange = useCallback((_e: React.MouseEvent<HTMLElement, MouseEvent>, newView: ActivityView | null) => {
        if (newView !== null) {
            setActivityView(newView);
        }
    }, []);

    // NOTE: We need to provide a custom theme due to a MRT bug causing the initial theme to always be used
    // https://github.com/KevinVandy/material-react-table/issues/1429
    const mrtTheme = useMemo<Partial<MRT_Theme>>(() => ({
        baseBackgroundColor: theme.palette.background.paper
    }), [theme]);

    const table = useMaterialReactTable({
        ...DEFAULT_TABLE_OPTIONS,
        mrtTheme,

        columns,
        data: logEntries,

        // State
        initialState: {
            density: 'compact'
        },
        state: {
            isLoading,
            columnFilters,
            pagination,
            sorting
        },

        manualFiltering: true,
        manualSorting: true,
        onColumnFiltersChange: setColumnFilters,
        onSortingChange: setSorting,
        enableMultiSort: true,
        enableGlobalFilter: false,

        // Server pagination
        manualPagination: true,
        onPaginationChange: setPagination,
        rowCount,

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
        <TablePage
            id='serverActivityPage'
            title={globalize.translate('HeaderActivity')}
            className='mainAnimatedPage type-interior'
            table={table}
        />
    );
};

Component.displayName = 'ActivityPage';
