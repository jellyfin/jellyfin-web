/**
 * @deprecated This route is mostly migrated but uses legacy table patterns.
 *
 * Migration:
 * - Uses TanStack Table (already migrated)
 * - Replace TablePage wrapper with DataTable component
 * - Ensure all cells have proper types
 *
 * @see src/styles/LEGACY_DEPRECATION_GUIDE.md
 */

import { parseISO } from 'date-fns/parseISO';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { ActivityLogEntry } from '@jellyfin/sdk/lib/generated-client/models/activity-log-entry';
import { LogLevel } from '@jellyfin/sdk/lib/generated-client/models/log-level';
import { ToggleGroup, ToggleGroupItem } from 'ui-primitives';
import type { ColumnDef } from '@tanstack/react-table';
import type { CellContext } from '@tanstack/react-table';
import { useSearchParams } from 'hooks/useSearchParams';

import DateTimeCell from 'apps/dashboard/components/table/DateTimeCell';
import TablePage from 'apps/dashboard/components/table/TablePage';
import { useLogEntries } from 'apps/dashboard/features/activity/api/useLogEntries';
import ActionsCell from 'apps/dashboard/features/activity/components/ActionsCell';
import LogLevelCell from 'apps/dashboard/features/activity/components/LogLevelCell';
import OverviewCell from 'apps/dashboard/features/activity/components/OverviewCell';
import UserAvatarButton from 'apps/dashboard/components/UserAvatarButton';
import { type UsersRecords, useUsersDetails } from 'hooks/useUsers';
import globalize from 'lib/globalize';
import { toBoolean } from 'utils/string';

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

const getUserCell = (users: UsersRecords) =>
    function UserCell({ row }: CellContext<ActivityLogEntry, unknown>) {
        return <UserAvatarButton user={(row.original.UserId && users[row.original.UserId]) || undefined} />;
    };

export const Component = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const [activityView, setActivityView] = useState(getActivityView(searchParams.get(VIEW_PARAM)));

    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: DEFAULT_PAGE_SIZE
    });

    const { usersById: users, names: userNames, isLoading: isUsersLoading } = useUsersDetails();

    const UserCell = getUserCell(users);

    const activityParams = useMemo(
        () => ({
            startIndex: pagination.pageIndex * pagination.pageSize,
            limit: pagination.pageSize,
            hasUserId: activityView !== ActivityView.All ? activityView === ActivityView.User : undefined
        }),
        [activityView, pagination.pageIndex, pagination.pageSize]
    );

    const { data, isLoading: isLogEntriesLoading } = useLogEntries(activityParams);
    const logEntries = useMemo(() => data?.Items || [], [data]);
    const rowCount = useMemo(() => data?.TotalRecordCount || 0, [data]);

    const isLoading = isUsersLoading || isLogEntriesLoading;

    const userColumn = useMemo<ColumnDef<ActivityLogEntry>[]>(
        () =>
            activityView === ActivityView.System
                ? []
                : [
                      {
                          id: 'User',
                          accessorFn: row => row.UserId && users[row.UserId]?.Name,
                          header: globalize.translate('LabelUser'),
                          size: 75,
                          cell: UserCell,
                          enableResizing: false
                      }
                  ],
        [activityView, users, UserCell]
    );

    const columns = useMemo<ColumnDef<ActivityLogEntry>[]>(
        () => [
            {
                id: 'Date',
                accessorFn: row => (row.Date ? parseISO(row.Date) : undefined),
                header: globalize.translate('LabelTime'),
                size: 160,
                cell: DateTimeCell
            },
            {
                accessorKey: 'Severity',
                header: globalize.translate('LabelLevel'),
                size: 90,
                cell: LogLevelCell,
                enableResizing: false
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
                cell: OverviewCell
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
                cell: ActionsCell,
                enableResizing: false,
                enableSorting: false
            }
        ],
        [userColumn]
    );

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
    }, [activityView, searchParams, setSearchParams]);

    const renderToolbar = useCallback(
        () => (
            <ToggleGroup
                type="single"
                value={activityView}
                onValueChange={value => {
                    if (value) setActivityView(value as ActivityView);
                }}
            >
                <ToggleGroupItem value={ActivityView.All}>{globalize.translate('All')}</ToggleGroupItem>
                <ToggleGroupItem value={ActivityView.User}>{globalize.translate('LabelUser')}</ToggleGroupItem>
                <ToggleGroupItem value={ActivityView.System}>{globalize.translate('LabelSystem')}</ToggleGroupItem>
            </ToggleGroup>
        ),
        [activityView]
    );

    return (
        <TablePage
            id="serverActivityPage"
            title={globalize.translate('HeaderActivity')}
            className="mainAnimatedPage type-interior"
            data={logEntries}
            columns={columns}
            isLoading={isLoading}
            enableColumnResizing={true}
            manualPagination={true}
            rowCount={rowCount}
            pagination={pagination}
            onPaginationChange={setPagination}
            renderToolbar={renderToolbar}
        />
    );
};

Component.displayName = 'ActivityPage';
