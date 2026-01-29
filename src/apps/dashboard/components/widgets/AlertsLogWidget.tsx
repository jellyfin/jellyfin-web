import { useLogEntries } from 'apps/dashboard/features/activity/api/useLogEntries';
import ActivityListItem from 'apps/dashboard/features/activity/components/ActivityListItem';
import { subSeconds } from 'date-fns';
import globalize from 'lib/globalize';
import React, { useMemo } from 'react';
import { vars } from 'styles/tokens.css.ts';
import { List, Paper } from 'ui-primitives';
import Widget from './Widget';

const AlertsLogWidget = (): React.ReactElement | null => {
    const weekBefore = useMemo(() => subSeconds(new Date(), 7 * 24 * 60 * 60).toISOString(), []);

    const { data: alerts, isPending } = useLogEntries({
        startIndex: 0,
        limit: 4,
        minDate: weekBefore,
        hasUserId: false
    });

    if (isPending || !alerts?.Items || alerts.Items.length === 0) return null;

    return (
        <Widget title={globalize.translate('Alerts')} href="/dashboard/activity?useractivity=false">
            <Paper
                variant="outlined"
                style={{ borderRadius: vars.borderRadius.md, overflow: 'hidden' }}
            >
                <List style={{ '--list-item-padding-y': '8px', '--list-item-padding-x': '12px' }}>
                    {alerts.Items.map((entry, index) => (
                        <React.Fragment key={entry.Id}>
                            <ActivityListItem
                                item={entry}
                                displayShortOverview={false}
                                to="/dashboard/activity?useractivity=false"
                            />
                            {index < (alerts.Items?.length ?? 0) - 1 && (
                                <div style={{ height: 1, backgroundColor: vars.colors.divider }} />
                            )}
                        </React.Fragment>
                    ))}
                </List>
            </Paper>
        </Widget>
    );
};

export default AlertsLogWidget;
