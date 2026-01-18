import React, { useMemo } from 'react';
import globalize from 'lib/globalize';
import Widget from './Widget';
import List from '@mui/material/List';
import ActivityListItem from 'apps/dashboard/features/activity/components/ActivityListItem';
import { useLogEntries } from 'apps/dashboard/features/activity/api/useLogEntries';
import subSeconds from 'date-fns/subSeconds';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack/Stack';

const ActivityLogWidget = () => {
    const dayBefore = useMemo(() => (
        subSeconds(new Date(), 24 * 60 * 60).toISOString()
    ), []);

    const { data: logs, isPending } = useLogEntries({
        startIndex: 0,
        limit: 7,
        minDate: dayBefore,
        hasUserId: true
    });

    return (
        <Widget
            title={globalize.translate('HeaderActivity')}
            href='/dashboard/activity?useractivity=true'
        >
            {isPending ? (
                <Stack spacing={2}>
                    <Skeleton variant='rounded' height={60} />
                    <Skeleton variant='rounded' height={60} />
                    <Skeleton variant='rounded' height={60} />
                    <Skeleton variant='rounded' height={60} />
                </Stack>
            ) : (
                <List sx={{ bgcolor: 'background.paper' }}>
                    {logs?.Items?.map(entry => (
                        <ActivityListItem
                            key={entry.Id}
                            item={entry}
                            displayShortOverview={true}
                            to='/dashboard/activity?useractivity=true'
                        />
                    ))}
                </List>
            )}
        </Widget>
    );
};

export default ActivityLogWidget;
