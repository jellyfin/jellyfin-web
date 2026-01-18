import type { SessionInfoDto } from '@jellyfin/sdk/lib/generated-client/models/session-info-dto';
import { parseISO, subSeconds } from 'date-fns';;

const MIN_SESSION_ACTIVE_TIME = 95;

const filterSessions = (sessions: SessionInfoDto[] = []) => {
    const minActiveDate = subSeconds(new Date(), MIN_SESSION_ACTIVE_TIME);

    return sessions.filter(session => {
        if (!session.LastActivityDate) return false;

        const lastActivityDate = parseISO(session.LastActivityDate);

        return !!((lastActivityDate >= minActiveDate) && (session.NowPlayingItem || session.UserId));
    });
};

export default filterSessions;
