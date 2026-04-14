import type { SessionInfoDto } from '@jellyfin/sdk/lib/generated-client/models/session-info-dto';
import { SessionMessageType } from '@jellyfin/sdk/lib/generated-client/models/session-message-type';
import { useApi } from 'hooks/useApi';
import { ApiClient } from 'jellyfin-apiclient';
import { useCallback, useEffect } from 'react';
import serverNotifications from 'scripts/serverNotifications';
import Events, { Event } from 'utils/events';
import { QUERY_KEY, useSessions } from '../api/useSessions';
import { queryClient } from 'utils/query/queryClient';
import filterSessions from '../utils/filterSessions';

const QUERY_PARAMS = {
    activeWithinSeconds: 960
};

const FALLBACK_POLL_INTERVAL_MS = 2000;

const useLiveSessions = () => {
    const { __legacyApiClient__ } = useApi();

    const sessionsQuery = useSessions(QUERY_PARAMS);

    const updateSessions = useCallback((sessions: SessionInfoDto[]) => {
        const newSessions = filterSessions(sessions);
        const data = queryClient.getQueryData([ QUERY_KEY, QUERY_PARAMS ]) as SessionInfoDto[];
        if (data) {
            const currentSessions = [ ...data ];

            for (const session of newSessions) {
                const sessionIndex = currentSessions.findIndex((value) => value.DeviceId === session.DeviceId);
                if (sessionIndex == -1) {
                    currentSessions.push(session);
                } else {
                    currentSessions[sessionIndex] = session;
                }
            }
            return currentSessions;
        } else {
            return newSessions;
        }
    }, []);

    useEffect(() => {
        const onSessionsUpdate = (evt: Event, apiClient: ApiClient, info: SessionInfoDto[]) => {
            queryClient.setQueryData([ QUERY_KEY, QUERY_PARAMS ], updateSessions(info));
        };

        const fallbackInterval = setInterval(() => {
            if (!__legacyApiClient__?.isMessageChannelOpen()) {
                void queryClient.invalidateQueries({
                    queryKey: [ QUERY_KEY ]
                });
            }
        }, FALLBACK_POLL_INTERVAL_MS);

        __legacyApiClient__?.sendMessage(SessionMessageType.SessionsStart, '0,1500');
        Events.on(serverNotifications, SessionMessageType.Sessions, onSessionsUpdate);

        return () => {
            clearInterval(fallbackInterval);
            __legacyApiClient__?.sendMessage(SessionMessageType.SessionsStop, null);
            Events.off(serverNotifications, SessionMessageType.Sessions, onSessionsUpdate);
        };
    }, []);

    return sessionsQuery;
};

export default useLiveSessions;
