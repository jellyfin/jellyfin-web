import React from 'react';
import globalize from 'lib/globalize';
import Widget from './Widget';
import List from '@mui/material/List';
import ActivityListItem from 'apps/dashboard/features/activity/components/ActivityListItem';
import type { ActivityLogEntry } from '@jellyfin/sdk/lib/generated-client/models';

type IProps = {
    alerts?: ActivityLogEntry[];
};

const AlertsLogWidget = ({ alerts }: IProps) => {
    return (
        <Widget
            title={globalize.translate('Alerts')}
            href='/dashboard/activity?useractivity=false'
        >
            <List sx={{ bgcolor: 'background.paper' }}>
                {alerts?.map(entry => (
                    <ActivityListItem
                        key={entry.Id}
                        item={entry}
                        displayShortOverview={false}
                    />
                ))}
            </List>
        </Widget>
    );
};

export default AlertsLogWidget;
