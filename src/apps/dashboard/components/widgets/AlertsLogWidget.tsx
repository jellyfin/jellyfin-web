import React, { useMemo } from 'react';
import globalize from 'lib/globalize';
import Widget from './Widget';
import List from '@mui/material/List';
import ActivityListItem from 'apps/dashboard/features/activity/components/ActivityListItem';
import subSeconds from 'date-fns/subSeconds';
import { useLogEntries } from 'apps/dashboard/features/activity/api/useLogEntries';

const AlertsLogWidget = () => {
    const weekBefore = useMemo(() => (
        subSeconds(new Date(), 7 * 24 * 60 * 60).toISOString()
    ), []);

    const { data: alerts, isPending } = useLogEntries({
        startIndex: 0,
        limit: 4,
        minDate: weekBefore,
        hasUserId: false
    });

    if (isPending || alerts?.Items?.length === 0) return null;

    return (
        <Widget
            title={globalize.translate('Alerts')}
            href='/dashboard/activity?useractivity=false'
        >
            <List sx={{ bgcolor: 'background.paper' }}>
                {alerts?.Items?.map(entry => (
                    <ActivityListItem
                        key={entry.Id}
                        item={entry}
                        displayShortOverview={false}
                        to='/dashboard/activity?useractivity=false'
                    />
                ))}
            </List>
        </Widget>
    );
};

export default AlertsLogWidget;
