import React, { type FunctionComponent } from 'react';
import type { LogFile } from '@jellyfin/sdk/lib/generated-client/models/log-file';
import { List, ListItem, ListItemContent } from 'ui-primitives/List';
import { Text } from 'ui-primitives/Text';
import datetime from 'scripts/datetime';
import ListItemLink from 'components/ListItemLink';

interface LogItemProps {
    logs: LogFile[];
}

const LogItemList: FunctionComponent<LogItemProps> = ({ logs }: LogItemProps) => {
    const getDate = (logFile: LogFile) => {
        const date = datetime.parseISO8601Date(logFile.DateModified || '', true) || new Date();
        return datetime.toLocaleDateString(date) + ' ' + datetime.getDisplayTime(date);
    };

    return (
        <List size="md">
            {logs.map(log => {
                return (
                    <ListItem key={log.Name}>
                        <ListItemLink to={`/dashboard/logs/${log.Name}`}>
                            <ListItemContent>
                                <Text weight="bold">{log.Name}</Text>
                                <Text size="sm" color="secondary">
                                    {getDate(log)}
                                </Text>
                            </ListItemContent>
                        </ListItemLink>
                    </ListItem>
                );
            })}
        </List>
    );
};

export default LogItemList;
