import type { SessionInfoDto } from '@jellyfin/sdk/lib/generated-client/models/session-info-dto';
import { parseISO, subSeconds } from 'date-fns';

const filterSessions = (sessions: SessionInfoDto[], activeWithinSeconds: number) => {
    const minActiveDate = subSeconds(new Date(), activeWithinSeconds);

    return sessions.filter(session => {
        if (!session.LastActivityDate) return false;

        const lastActivityDate = parseISO(session.LastActivityDate);

        return !!((lastActivityDate >= minActiveDate) && (session.NowPlayingItem || session.UserId));
    });
};

export default filterSessions;
