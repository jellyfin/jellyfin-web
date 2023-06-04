import React, { useEffect, useState } from 'react';
import { getActivityLogApi } from '@jellyfin/sdk/lib/utils/api/activity-log-api';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import type { ActivityLogEntry } from '@jellyfin/sdk/lib/generated-client/models/activity-log-entry';
import { LogLevel } from '@jellyfin/sdk/lib/generated-client/models/log-level';
import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import Chip from '@mui/material/Chip';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';

import Page from 'components/Page';
import UserAvatar from 'components/UserAvatar';
import { useApi } from 'hooks/useApi';
import globalize from 'scripts/globalize';

const DEFAULT_PAGE_SIZE = 25;

const getRowId = (row: ActivityLogEntry) => row.Id ?? -1;

const LogLevelChip = ({ level }: { level: LogLevel }) => {
    let color: 'info' | 'warning' | 'error' | undefined = undefined;
    switch (level) {
        case LogLevel.Information:
            color = 'info';
            break;
        case LogLevel.Warning:
            color = 'warning';
            break;
        case LogLevel.Error:
        case LogLevel.Critical:
            color = 'error';
            break;
    }

    const levelText = globalize.translate(`LogLevel.${level}`);

    return (
        <Chip
            size='small'
            color={color}
            label={levelText}
            title={levelText}
        />
    );
};

const Activity = () => {
    const { api } = useApi();

    const columns: GridColDef[] = [
        {
            field: 'Date',
            headerName: globalize.translate('LabelDate'),
            width: 180,
            type: 'dateTime',
            valueGetter: ({ row }) => new Date(row.Date)
        },
        {
            field: 'Severity',
            headerName: globalize.translate('LabelLevel'),
            width: 110,
            renderCell: ({ row }) => (
                row.Severity ? (
                    <LogLevelChip level={row.Severity} />
                ) : undefined
            )
        },
        {
            field: 'User',
            headerName: globalize.translate('LabelUser'),
            width: 60,
            valueGetter: ({ row }) => users[row.UserId]?.Name,
            renderCell: ({ row }) => (
                <UserAvatar
                    user={users[row.UserId]}
                    showTitle
                />
            )
        },
        {
            field: 'Name',
            headerName: globalize.translate('LabelName'),
            width: 200
        },
        {
            field: 'Overview',
            headerName: globalize.translate('LabelOverview'),
            width: 200,
            valueGetter: ({ row }) => row.Overview ?? row.ShortOverview
        },
        {
            field: 'Type',
            headerName: globalize.translate('LabelType'),
            width: 150
        }
    ];

    const [ isLoading, setIsLoading ] = useState(true);
    const [paginationModel, setPaginationModel] = useState({
        page: 0,
        pageSize: DEFAULT_PAGE_SIZE
    });
    const [ rowCount, setRowCount ] = useState(0);
    const [ rows, setRows ] = useState<ActivityLogEntry[]>([]);
    const [ users, setUsers ] = useState<Record<string, UserDto>>({});

    useEffect(() => {
        if (api) {
            const fetchUsers = async () => {
                const { data } = await getUserApi(api).getUsers();
                const usersById: Record<string, UserDto> = {};
                data.forEach(user => {
                    if (user.Id) {
                        usersById[user.Id] = user;
                    }
                });

                setUsers(usersById);
            };

            fetchUsers()
                .catch(err => {
                    console.error('[activity] failed to fetch users', err);
                });
        }
    }, [ api ]);

    useEffect(() => {
        if (api) {
            const fetchActivity = async () => {
                const { data } = await getActivityLogApi(api)
                    .getLogEntries({
                        startIndex: paginationModel.page * paginationModel.pageSize,
                        limit: paginationModel.pageSize
                    });

                setRowCount(data.TotalRecordCount ?? 0);
                setRows(data.Items ?? []);
                setIsLoading(false);
            };

            fetchActivity()
                .catch(err => {
                    console.error('[activity] failed to fetch activity log entries', err);
                });
        }
    }, [ api, paginationModel ]);

    return (
        <Page
            id='serverActivityPage'
            title={globalize.translate('HeaderActivity')}
            className='mainAnimatedPage type-interior'
        >
            <div className='content-primary'>
                <h2>{globalize.translate('HeaderActivity')}</h2>
                <DataGrid
                    columns={columns}
                    rows={rows}
                    pageSizeOptions={[ 10, 25, 50, 100 ]}
                    paginationMode='server'
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    rowCount={rowCount}
                    getRowId={getRowId}
                    loading={isLoading}
                    sx={{
                        minHeight: 500
                    }}
                />
            </div>
        </Page>
    );
};

export default Activity;
