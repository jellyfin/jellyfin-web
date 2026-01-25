import React, { useMemo } from 'react';
import globalize from 'lib/globalize';
import Widget from './Widget';
import ActivityListItem from 'apps/dashboard/features/activity/components/ActivityListItem';
import { useLogEntries } from 'apps/dashboard/features/activity/api/useLogEntries';
import { subSeconds } from 'date-fns';
import { List } from 'ui-primitives/List';
import { Paper } from 'ui-primitives/Paper';
import { Skeleton } from 'ui-primitives/Skeleton';
import { Flex } from 'ui-primitives/Box';
import { vars } from 'styles/tokens.css';

const ActivityLogWidget = (): React.ReactElement => {
    const dayBefore = useMemo(() => subSeconds(new Date(), 24 * 60 * 60).toISOString(), []);

    const { data: logs, isPending } = useLogEntries({
        startIndex: 0,
        limit: 7,
        minDate: dayBefore,
        hasUserId: true
    });

    return (
        <Widget title={globalize.translate('HeaderActivity')} href="/dashboard/activity?useractivity=true">
            {isPending ? (
                <Flex style={{ flexDirection: 'column', gap: vars.spacing.md }}>
                    <Skeleton variant="rectangular" height={60} style={{ borderRadius: vars.borderRadius.md }} />
                    <Skeleton variant="rectangular" height={60} style={{ borderRadius: vars.borderRadius.md }} />
                    <Skeleton variant="rectangular" height={60} style={{ borderRadius: vars.borderRadius.md }} />
                    <Skeleton variant="rectangular" height={60} style={{ borderRadius: vars.borderRadius.md }} />
                </Flex>
            ) : (
                <Paper variant="outlined" style={{ borderRadius: vars.borderRadius.md, overflow: 'hidden' }}>
                    <List style={{ '--list-item-padding-y': '8px', '--list-item-padding-x': '12px' }}>
                        {logs?.Items?.map((entry, index) => (
                            <React.Fragment key={entry.Id}>
                                <ActivityListItem
                                    item={entry}
                                    displayShortOverview={true}
                                    to="/dashboard/activity?useractivity=true"
                                />
                                {index < (logs.Items?.length ?? 0) - 1 && (
                                    <div style={{ height: 1, backgroundColor: vars.colors.divider }} />
                                )}
                            </React.Fragment>
                        ))}
                    </List>
                </Paper>
            )}
        </Widget>
    );
};

export default ActivityLogWidget;
