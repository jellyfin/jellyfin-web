import type { SessionInfoDto } from '@jellyfin/sdk/lib/generated-client/models/session-info-dto';
import { OutboundWebSocketMessageType } from '@jellyfin/sdk/lib/websocket';
import { useEffect } from 'react';

import { useApi } from 'hooks/useApi';
import { queryClient } from 'utils/query/queryClient';

import { QUERY_KEY, useSessions } from '../api/useSessions';
import filterSessions from '../utils/filterSessions';

const QUERY_PARAMS = {
    activeWithinSeconds: 960
};
const QUERY_KEY_WITH_PARAMS = [ QUERY_KEY, QUERY_PARAMS ];

function preserveSessionOrder(sessions: SessionInfoDto[], previous: SessionInfoDto[] = []) {
    // Keep existing cards in place as the server reorders sessions by activity.
    const orderById = new Map(previous.map((session, index) => [ session.Id, index ]));
    return sessions.sort((a, b) => (orderById.get(a.Id) ?? previous.length)
        - (orderById.get(b.Id) ?? previous.length));
}

const useLiveSessions = () => {
    const { api } = useApi();

    const sessionsQuery = useSessions(QUERY_PARAMS);

    useEffect(() => {
        return api?.subscribe([ OutboundWebSocketMessageType.Sessions ], ({ Data }) => {
            if (!Data) return;

            // Give the live snapshot precedence over an in-flight REST request.
            void queryClient.cancelQueries({ queryKey: QUERY_KEY_WITH_PARAMS, exact: true });
            const sessions = filterSessions(Data, QUERY_PARAMS.activeWithinSeconds);
            queryClient.setQueryData<SessionInfoDto[]>(QUERY_KEY_WITH_PARAMS, previous =>
                preserveSessionOrder(sessions, previous ?? undefined));
        });
    }, [ api ]);

    return sessionsQuery;
};

export default useLiveSessions;
