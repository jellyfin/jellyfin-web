import type { LogFile } from '@jellyfin/sdk/lib/generated-client/models/log-file';
import LinkButton from 'elements/emby-button/LinkButton';
import { useApi } from 'hooks/useApi';
import React, { FunctionComponent } from 'react';
import datetime from 'scripts/datetime';

type LogItemProps = {
    logFile: LogFile;
};

const LogItem: FunctionComponent<LogItemProps> = ({ logFile }: LogItemProps) => {
    const { api } = useApi();

    const getLogFileUrl = () => {
        if (!api) return;

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
        <LinkButton href={getLogFileUrl()} target='_blank' rel='noreferrer' className='listItem listItem-border' style={{ color: 'inherit' }}>
            <div className='listItemBody two-line'>
                <h3 className='listItemBodyText' dir='ltr' style={{ textAlign: 'left' }}>{logFile.Name}</h3>
                <div className='listItemBodyText secondary'>{getDate()}</div>
            </div>
        </LinkButton>
    );
};

export default LogItem;
