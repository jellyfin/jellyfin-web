import React, { useMemo } from 'react';
import type { ActivityLogEntry } from '@jellyfin/sdk/lib/generated-client/models/activity-log-entry';
import Notifications from '@mui/icons-material/Notifications';
import Avatar from '@mui/material/Avatar';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import formatRelative from 'date-fns/formatRelative';
import { getLocale } from 'utils/dateFnsLocale';
import Stack from '@mui/material/Stack';
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
            return formatRelative(Date.parse(item.Date), Date.now(), { locale: getLocale() });
        } else {
            return 'N/A';
        }
    }, [ item ]);

    return (
        <ListItem disablePadding>
            <ListItemLink to={to}>
                <ListItemAvatar>
                    <Avatar sx={{ bgcolor: getLogLevelColor(item.Severity || LogLevel.Information) + '.main' }}>
                        <Notifications sx={{ color: '#fff' }} />
                    </Avatar>
                </ListItemAvatar>

                <ListItemText
                    primary={<Typography>{item.Name}</Typography>}
                    secondary={(
                        <Stack>
                            <Typography variant='body1' color='text.secondary'>
                                {relativeDate}
                            </Typography>
                            {displayShortOverview && (
                                <Typography variant='body1' color='text.secondary'>
                                    {item.ShortOverview}
                                </Typography>
                            )}
                        </Stack>
                    )}
                    disableTypography
                />
            </ListItemLink>
        </ListItem>
    );
};

export default ActivityListItem;
