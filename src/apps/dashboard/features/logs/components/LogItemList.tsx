import { FunctionComponent } from 'react';
import type { LogFile } from '@jellyfin/sdk/lib/generated-client/models/log-file';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import datetime from 'scripts/datetime';
import ListItemLink from 'components/ListItemLink';

type LogItemProps = {
    logs: LogFile[];
};

const LogItemList: FunctionComponent<LogItemProps> = ({ logs }: LogItemProps) => {
    const getDate = (logFile: LogFile) => {
        if (!logFile.DateModified) {
            throw new Error('Log file does not have a DateModified property');
        }
        const date = datetime.parseISO8601Date(logFile.DateModified, true);
        //  new Date(logFile.DateModified); // use this instead?
        return datetime.toLocaleDateString(date) + ' ' + datetime.getDisplayTime(date);
    };

    return (
        <List sx={{ bgcolor: 'background.paper' }}>
            {logs.map(log => {
                return (
                    <ListItem key={log.Name} disablePadding>
                        <ListItemLink to={`/dashboard/logs/${log.Name}`}>
                            <ListItemText
                                primary={log.Name}
                                secondary={getDate(log)}
                                slotProps={{
                                    primary: {
                                        variant: 'h3'
                                    },
                                    secondary: {
                                        variant: 'body1'
                                    }
                                }}
                            />
                        </ListItemLink>
                    </ListItem>
                );
            })}
        </List>
    );
};

export default LogItemList;
