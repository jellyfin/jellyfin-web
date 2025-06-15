import React, { useMemo } from 'react';
import type { ActivityLogEntry } from '@jellyfin/sdk/lib/generated-client/models/activity-log-entry';
import Notifications from '@mui/icons-material/Notifications';
import Avatar from '@mui/material/Avatar';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import formatRelative from 'date-fns/formatRelative';
import { getLocale } from 'utils/dateFnsLocale';
import Stack from '@mui/material/Stack';

type IProps = {
    item: ActivityLogEntry;
    displayShortOverview: boolean;
};

const ActivityListItem = ({ item, displayShortOverview }: IProps) => {
    const relativeDate = useMemo(() => {
        if (item.Date) {
            return formatRelative(Date.parse(item.Date), Date.now(), { locale: getLocale() });
        } else {
            return 'N/A';
        }
    }, [ item ]);

    return (
        <ListItem disablePadding key={item.Id}>
            <ListItemButton>
                <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
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
            </ListItemButton>
        </ListItem>
    );
};

export default ActivityListItem;
