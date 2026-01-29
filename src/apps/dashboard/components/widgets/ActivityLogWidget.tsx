import { useLogEntries } from 'apps/dashboard/features/activity/api/useLogEntries';
import ActivityListItem from 'apps/dashboard/features/activity/components/ActivityListItem';
import { subSeconds } from 'date-fns';
import globalize from 'lib/globalize';
import React, { useMemo } from 'react';
import { vars } from 'styles/tokens.css.ts';
import { Flex, List, Paper, Skeleton } from 'ui-primitives';
import Widget from './Widget';

const ActivityLogWidget = (): React.ReactElement => {
    const dayBefore = useMemo(() => subSeconds(new Date(), 24 * 60 * 60).toISOString(), []);

    const { data: logs, isPending } = useLogEntries({
        startIndex: 0,
        limit: 7,
        minDate: dayBefore,
        hasUserId: true
    });

    return (
        <Widget
            title={globalize.translate('HeaderActivity')}
            href="/dashboard/activity?useractivity=true"
        >
            {isPending ? (
                <Flex style={{ flexDirection: 'column', gap: vars.spacing['5'] }}>
                    <Skeleton
                        variant="rectangular"
                        height={60}
                        style={{ borderRadius: vars.borderRadius.md }}
                    />
                    <Skeleton
                        variant="rectangular"
                        height={60}
                        style={{ borderRadius: vars.borderRadius.md }}
                    />
                    <Skeleton
                        variant="rectangular"
                        height={60}
                        style={{ borderRadius: vars.borderRadius.md }}
                    />
                    <Skeleton
                        variant="rectangular"
                        height={60}
                        style={{ borderRadius: vars.borderRadius.md }}
                    />
                </Flex>
            ) : (
                <Paper
                    variant="outlined"
                    style={{ borderRadius: vars.borderRadius.md, overflow: 'hidden' }}
                >
                    <List
                        style={{ '--list-item-padding-y': '8px', '--list-item-padding-x': '12px' }}
                    >
                        {logs?.Items?.map((entry, index) => (
                            <React.Fragment key={entry.Id}>
                                <ActivityListItem
                                    item={entry}
                                    displayShortOverview={true}
                                    to="/dashboard/activity?useractivity=true"
                                />
                                {index < (logs.Items?.length ?? 0) - 1 && (
                                    <div
                                        style={{ height: 1, backgroundColor: vars.colors.divider }}
                                    />
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
