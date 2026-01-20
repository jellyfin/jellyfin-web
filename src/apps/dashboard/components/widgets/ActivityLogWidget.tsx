import React, { useMemo } from 'react';
import globalize from 'lib/globalize';
import Widget from './Widget';
import List from '@mui/joy/List';
import Sheet from '@mui/joy/Sheet';
import ActivityListItem from 'apps/dashboard/features/activity/components/ActivityListItem';
import { useLogEntries } from 'apps/dashboard/features/activity/api/useLogEntries';
import subSeconds from 'date-fns/subSeconds';
import Skeleton from '@mui/joy/Skeleton';
import Stack from '@mui/joy/Stack';

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
                    <Skeleton variant='rectangular' height={60} sx={{ borderRadius: 'md' }} />
                    <Skeleton variant='rectangular' height={60} sx={{ borderRadius: 'md' }} />
                    <Skeleton variant='rectangular' height={60} sx={{ borderRadius: 'md' }} />
                    <Skeleton variant='rectangular' height={60} sx={{ borderRadius: 'md' }} />
                </Stack>
            ) : (
                <Sheet variant="outlined" sx={{ borderRadius: 'md', overflow: 'hidden' }}>
                    <List sx={{ '--ListItem-paddingY': '8px', '--ListItem-paddingX': '12px' }}>
                        {logs?.Items?.map((entry, index) => (
                            <React.Fragment key={entry.Id}>
                                <ActivityListItem
                                    item={entry}
                                    displayShortOverview={true}
                                    to='/dashboard/activity?useractivity=true'
                                />
                                {index < (logs.Items?.length || 0) - 1 && (
                                    <div style={{ height: 1, backgroundColor: 'var(--joy-palette-divider)' }} />
                                )}
                            </React.Fragment>
                        ))}
                    </List>
                </Sheet>
            )}
        </Widget>
    );
};

export default ActivityLogWidget;