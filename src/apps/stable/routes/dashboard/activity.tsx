import React, { FC, useCallback, useEffect, useState } from 'react';
import { getActivityLogApi } from '@jellyfin/sdk/lib/utils/api/activity-log-api';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import type { ActivityLogEntry } from '@jellyfin/sdk/lib/generated-client/models/activity-log-entry';
import { LogLevel } from '@jellyfin/sdk/lib/generated-client/models/log-level';
import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import Info from '@mui/icons-material/Info';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import IconButton from '@mui/material/IconButton';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useSearchParams } from 'react-router-dom';

import Page from 'components/Page';
import UserAvatar from 'components/UserAvatar';
import { useApi } from 'hooks/useApi';
import { parseISO8601Date, toLocaleDateString, toLocaleTimeString } from 'scripts/datetime';
import globalize from 'scripts/globalize';
import { toBoolean } from 'utils/string';

const DEFAULT_PAGE_SIZE = 25;
const VIEW_PARAM = 'useractivity';

const enum ActivityView {
    All,
    User,
    System
}

const getActivityView = (param: string | null) => {
    if (param === null) return ActivityView.All;
    if (toBoolean(param)) return ActivityView.User;
    return ActivityView.System;
};

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

const OverviewCell: FC<ActivityLogEntry> = ({ Overview, ShortOverview }) => {
    const displayValue = ShortOverview ?? Overview;
    const [ open, setOpen ] = useState(false);

    const onTooltipClose = useCallback(() => {
        setOpen(false);
    }, []);

    const onTooltipOpen = useCallback(() => {
        setOpen(true);
    }, []);

    if (!displayValue) return null;

    return (
        <Box
            sx={{
                display: 'flex',
                width: '100%',
                alignItems: 'center'
            }}
        >
            <Box
                sx={{
                    flexGrow: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }}
                component='div'
                title={displayValue}
            >
                {displayValue}
            </Box>
            {ShortOverview && Overview && (
                <ClickAwayListener onClickAway={onTooltipClose}>
                    <Tooltip
                        title={Overview}
                        placement='top'
                        arrow
                        onClose={onTooltipClose}
                        open={open}
                        disableFocusListener
                        disableHoverListener
                        disableTouchListener
                    >
                        <IconButton onClick={onTooltipOpen}>
                            <Info />
                        </IconButton>
                    </Tooltip>
                </ClickAwayListener>
            )}
        </Box>
    );
};

const Activity = () => {
    const { api } = useApi();
    const [ searchParams, setSearchParams ] = useSearchParams();

    const [ activityView, setActivityView ] = useState(
        getActivityView(searchParams.get(VIEW_PARAM)));
    const [ isLoading, setIsLoading ] = useState(true);
    const [ paginationModel, setPaginationModel ] = useState({
        page: 0,
        pageSize: DEFAULT_PAGE_SIZE
    });
    const [ rowCount, setRowCount ] = useState(0);
    const [ rows, setRows ] = useState<ActivityLogEntry[]>([]);
    const [ users, setUsers ] = useState<Record<string, UserDto>>({});

    const userColDef: GridColDef[] = activityView !== ActivityView.System ? [
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
        }
    ] : [];

    const columns: GridColDef[] = [
        {
            field: 'Date',
            headerName: globalize.translate('LabelDate'),
            width: 90,
            type: 'date',
            valueGetter: ({ value }) => parseISO8601Date(value),
            valueFormatter: ({ value }) => toLocaleDateString(value)
        },
        {
            field: 'Time',
            headerName: globalize.translate('LabelTime'),
            width: 100,
            type: 'dateTime',
            valueGetter: ({ row }) => parseISO8601Date(row.Date),
            valueFormatter: ({ value }) => toLocaleTimeString(value)
        },
        {
            field: 'Severity',
            headerName: globalize.translate('LabelLevel'),
            width: 110,
            renderCell: ({ value }) => (
                value ? (
                    <LogLevelChip level={value} />
                ) : undefined
            )
        },
        ...userColDef,
        {
            field: 'Name',
            headerName: globalize.translate('LabelName'),
            width: 200
        },
        {
            field: 'Overview',
            headerName: globalize.translate('LabelOverview'),
            width: 220,
            valueGetter: ({ row }) => row.ShortOverview ?? row.Overview,
            renderCell: ({ row }) => (
                <OverviewCell {...row} />
            )
        },
        {
            field: 'Type',
            headerName: globalize.translate('LabelType'),
            width: 150
        }
    ];

    const onViewChange = useCallback((_e, newView: ActivityView | null) => {
        if (newView !== null) {
            setActivityView(newView);
        }
    }, []);

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
                const params: {
                    startIndex: number,
                    limit: number,
                    hasUserId?: boolean
                } = {
                    startIndex: paginationModel.page * paginationModel.pageSize,
                    limit: paginationModel.pageSize
                };
                if (activityView !== ActivityView.All) {
                    params.hasUserId = activityView === ActivityView.User;
                }

                const { data } = await getActivityLogApi(api)
                    .getLogEntries(params);

                setRowCount(data.TotalRecordCount ?? 0);
                setRows(data.Items ?? []);
                setIsLoading(false);
            };

            setIsLoading(true);
            fetchActivity()
                .catch(err => {
                    console.error('[activity] failed to fetch activity log entries', err);
                });
        }
    }, [ activityView, api, paginationModel ]);

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

    return (
        <Page
            id='serverActivityPage'
            title={globalize.translate('HeaderActivity')}
            className='mainAnimatedPage type-interior'
        >
            <div className='content-primary'>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'baseline',
                        marginY: 2
                    }}
                >
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant='h2'>
                            {globalize.translate('HeaderActivity')}
                        </Typography>
                    </Box>
                    <ToggleButtonGroup
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
                </Box>
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
