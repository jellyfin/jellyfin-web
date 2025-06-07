import type { SessionInfoDto } from '@jellyfin/sdk/lib/generated-client/models/session-info-dto';
import { SessionMessageType } from '@jellyfin/sdk/lib/generated-client/models/session-message-type';
import { useApi } from 'hooks/useApi';
import { ApiClient } from 'jellyfin-apiclient';
import { useEffect } from 'react';
import serverNotifications from 'scripts/serverNotifications';
import Events, { Event } from 'utils/events';
import { QUERY_KEY, useSessions } from '../api/useSessions';
import { queryClient } from 'utils/query/queryClient';
import filterSessions from '../utils/filterSessions';

const useLiveSessions = () => {
    const { __legacyApiClient__ } = useApi();

    const params = {
        activeWithinSeconds: 960
    };

    const sessionsQuery = useSessions(params);

    useEffect(() => {
        const onSessionsUpdate = (evt: Event, apiClient: ApiClient, info: SessionInfoDto[]) => {
            queryClient.setQueryData([ QUERY_KEY, params ], filterSessions(info));
        };

        __legacyApiClient__?.sendMessage(SessionMessageType.SessionsStart, '0,1500');
        Events.on(serverNotifications, SessionMessageType.Sessions, onSessionsUpdate);

        return () => {
            __legacyApiClient__?.sendMessage(SessionMessageType.SessionsStop, null);
            Events.off(serverNotifications, SessionMessageType.Sessions, onSessionsUpdate);
        };
    }, []);

    return sessionsQuery;
};

export default useLiveSessions;
