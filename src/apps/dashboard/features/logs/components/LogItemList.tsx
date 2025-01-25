import React, { FunctionComponent } from 'react';
import type { LogFile } from '@jellyfin/sdk/lib/generated-client/models/log-file';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useApi } from 'hooks/useApi';
import datetime from 'scripts/datetime';

type LogItemProps = {
    logs: LogFile[];
};

const LogItemList: FunctionComponent<LogItemProps> = ({ logs }: LogItemProps) => {
    const { api } = useApi();

    const getLogFileUrl = (logFile: LogFile) => {
        if (!api) return '';

        return api.getUri('/System/Logs/Log', {
            name: logFile.Name,
            api_key: api.accessToken
        });
    };

    const getDate = (logFile: LogFile) => {
        const date = datetime.parseISO8601Date(logFile.DateModified, true);
        return datetime.toLocaleDateString(date) + ' ' + datetime.getDisplayTime(date);
    };

    return (
        <List sx={{ bgcolor: 'background.paper' }}>
            {logs.map(log => {
                return (
                    <ListItem key={log.Name} disablePadding>
                        <ListItemButton href={getLogFileUrl(log)} target='_blank'>
                            <ListItemText
                                primary={log.Name}
                                primaryTypographyProps={{ variant: 'h3' }}
                                secondary={getDate(log)}
                                secondaryTypographyProps={{ variant: 'body1' }}
                            />
                            <OpenInNewIcon />
                        </ListItemButton>
                    </ListItem>
                );
            })}
        </List>
    );
};

export default LogItemList;
