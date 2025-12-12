import type { SessionInfo } from '@jellyfin/sdk/lib/generated-client/models/session-info';
import datetime from '@/scripts/datetime';

const getSessionNowPlayingTime = (session: SessionInfo) => {
    const nowPlayingItem = session.NowPlayingItem;

    let start = '0:00';
    let end = '0:00';

    if (nowPlayingItem) {
        if (session.PlayState?.PositionTicks) {
            start = datetime.getDisplayRunningTime(session.PlayState.PositionTicks);
        }

        if (nowPlayingItem.RunTimeTicks) {
            end = datetime.getDisplayRunningTime(nowPlayingItem.RunTimeTicks);
        }
    }

    return {
        start,
        end
    };
};

export default getSessionNowPlayingTime;
