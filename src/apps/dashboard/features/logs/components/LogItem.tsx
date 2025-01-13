import React, { FunctionComponent } from 'react';
import type { LogFile } from '@jellyfin/sdk/lib/generated-client/models/log-file';
import { Card, CardActionArea, CardContent, ListItemText } from '@mui/material';
import { useApi } from 'hooks/useApi';
import datetime from 'scripts/datetime';

type LogItemProps = {
    logFile: LogFile;
};

const LogItem: FunctionComponent<LogItemProps> = ({ logFile }: LogItemProps) => {
    const { api } = useApi();

    const getLogFileUrl = () => {
        if (!api) return '';

        let url = api.basePath + '/System/Logs/Log';

        url += '?name=' + encodeURIComponent(String(logFile.Name));
        url += '&api_key=' + encodeURIComponent(api.accessToken);

        return url;
    };

    const getDate = () => {
        const date = datetime.parseISO8601Date(logFile.DateModified, true);
        return datetime.toLocaleDateString(date) + ' ' + datetime.getDisplayTime(date);
    };

    return (
        <Card>
            <CardActionArea href={getLogFileUrl()} target='_blank'>
                <CardContent>
                    <ListItemText
                        primary={logFile.Name}
                        primaryTypographyProps={{ variant: 'h3' }}
                        secondary={getDate()}
                        secondaryTypographyProps={{ variant: 'body1' }}
                    />
                </CardContent>
            </CardActionArea>
        </Card>
    );
};

export default LogItem;
