import React, { useMemo } from 'react';
import globalize from 'lib/globalize';
import Widget from './Widget';
import List from '@mui/joy/List';
import Sheet from '@mui/joy/Sheet';
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

    if (isPending || !alerts?.Items || alerts.Items.length === 0) return null;

    return (
        <Widget
            title={globalize.translate('Alerts')}
            href='/dashboard/activity?useractivity=false'
        >
            <Sheet variant="outlined" sx={{ borderRadius: 'md', overflow: 'hidden' }}>
                <List sx={{ '--ListItem-paddingY': '8px', '--ListItem-paddingX': '12px' }}>
                    {alerts.Items.map((entry, index) => (
                        <React.Fragment key={entry.Id}>
                            <ActivityListItem
                                item={entry}
                                displayShortOverview={false}
                                to='/dashboard/activity?useractivity=false'
                            />
                            {index < alerts.Items!.length - 1 && (
                                <div style={{ height: 1, backgroundColor: 'var(--joy-palette-divider)' }} />
                            )}
                        </React.Fragment>
                    ))}
                </List>
            </Sheet>
        </Widget>
    );
};

export default AlertsLogWidget;