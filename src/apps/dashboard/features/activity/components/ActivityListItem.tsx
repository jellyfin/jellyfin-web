import React, { useMemo } from 'react';
import type { ActivityLogEntry } from '@jellyfin/sdk/lib/generated-client/models/activity-log-entry';
import Notifications from '@mui/icons-material/Notifications';
import Avatar from '@mui/joy/Avatar';
import ListItem from '@mui/joy/ListItem';
import ListItemDecorator from '@mui/joy/ListItemDecorator';
import ListItemContent from '@mui/joy/ListItemContent';
import Typography from '@mui/joy/Typography';
import formatRelative from 'date-fns/formatRelative';
import { getLocale } from 'utils/dateFnsLocale';
import Stack from '@mui/joy/Stack';
import getLogLevelColor from '../utils/getLogLevelColor';
import { LogLevel } from '@jellyfin/sdk/lib/generated-client/models/log-level';
import ListItemLink from 'components/ListItemLink';

type ActivityListItemProps = {
    item: ActivityLogEntry;
    displayShortOverview: boolean;
    to: string;
};

const ActivityListItem = ({ item, displayShortOverview, to }: ActivityListItemProps) => {
    const relativeDate = useMemo(() => {
        if (item.Date) {
            try {
                return formatRelative(new Date(item.Date), Date.now(), { locale: getLocale() });
            } catch (e) {
                return 'N/A';
            }
        } else {
            return 'N/A';
        }
    }, [ item.Date ]);

    const severity = item.Severity || LogLevel.Information;
    const color = severity === LogLevel.Error || severity === LogLevel.Fatal ? 'danger' :
                  severity === LogLevel.Warning ? 'warning' : 'primary';

    return (
        <ListItem sx={{ p: 0 }}>
            <ListItemLink to={to} sx={{ width: '100%', py: 1.5, px: 2 }}>
                <ListItemDecorator>
                    <Avatar variant="soft" color={color}>
                        <Notifications />
                    </Avatar>
                </ListItemDecorator>

                <ListItemContent>
                    <Typography level="body-sm" sx={{ whiteSpace: 'pre-wrap', fontWeight: 'bold' }}>
                        {item.Name}
                    </Typography>
                    <Stack spacing={0.5}>
                        <Typography level="body-xs" color="neutral">
                            {relativeDate}
                        </Typography>
                        {displayShortOverview && item.ShortOverview && (
                            <Typography level="body-xs" color="neutral" noWrap>
                                {item.ShortOverview}
                            </Typography>
                        )}
                    </Stack>
                </ListItemContent>
            </ListItemLink>
        </ListItem>
    );
};

export default ActivityListItem;