import React, { FunctionComponent } from 'react';
import type { LogFile } from '@jellyfin/sdk/lib/generated-client/models/log-file';
import { Box, List, ListItem, ListItemButton, ListItemText, useTheme } from '@mui/material';
import { useApi } from 'hooks/useApi';
import datetime from 'scripts/datetime';

type LogItemProps = {
    logs: LogFile[];
};

const LogItemList: FunctionComponent<LogItemProps> = ({ logs }: LogItemProps) => {
    const { api } = useApi();
    const theme = useTheme();

    const getLogFileUrl = (logFile: LogFile) => {
        if (!api) return '';

        let url = api.basePath + '/System/Logs/Log';

        url += '?name=' + encodeURIComponent(String(logFile.Name));
        url += '&api_key=' + encodeURIComponent(api.accessToken);

        return url;
    };

    const getDate = (logFile: LogFile) => {
        const date = datetime.parseISO8601Date(logFile.DateModified, true);
        return datetime.toLocaleDateString(date) + ' ' + datetime.getDisplayTime(date);
    };

    return (
        <Box sx={{ backgroundColor: theme.palette.background.paper }}>
            <List>
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
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>
        </Box>
    );
};

export default LogItemList;
