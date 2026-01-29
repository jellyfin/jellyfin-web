import type { LogFile } from '@jellyfin/sdk/lib/generated-client/models/log-file';
import ListItemLink from 'components/ListItemLink';
import React, { type FunctionComponent } from 'react';
import datetime from 'scripts/datetime';
import { List, ListItem, ListItemContent, Text } from 'ui-primitives';

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
            {logs.map((log) => {
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
