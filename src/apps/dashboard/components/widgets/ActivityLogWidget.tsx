import React from 'react';
import globalize from 'lib/globalize';
import Widget from './Widget';
import List from '@mui/material/List';
import ActivityListItem from 'apps/dashboard/features/activity/components/ActivityListItem';
import type { ActivityLogEntry } from '@jellyfin/sdk/lib/generated-client/models/activity-log-entry';

type IProps = {
    logs?: ActivityLogEntry[];
};

const ActivityLogWidget = ({ logs }: IProps) => {
    return (
        <Widget
            title={globalize.translate('HeaderActivity')}
            href='/dashboard/activity?useractivity=true'
        >
            <List sx={{ bgcolor: 'background.paper' }}>
                {logs?.map(entry => (
                    <ActivityListItem
                        key={entry.Id}
                        item={entry}
                        displayShortOverview={true}
                    />
                ))}
            </List>
        </Widget>
    );
};

export default ActivityLogWidget;
