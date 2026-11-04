import type { SessionInfoDto } from '@jellyfin/sdk/lib/generated-client/models/session-info-dto';
import { PlayMethod } from '@jellyfin/sdk/lib/generated-client/models/play-method';

export type DisplayPlayMethod = 'Remux' | 'DirectStream' | 'Transcode' | 'DirectPlay';

export function getDisplayPlayMethod(session: SessionInfoDto): DisplayPlayMethod | null {
    if (!session.NowPlayingItem) {
        return null;
    }

    const playMethod = session.PlayState?.PlayMethod;

    if ((session.TranscodingInfo?.IsVideoDirect || !session.TranscodingInfo?.VideoCodec) && session.TranscodingInfo?.IsAudioDirect) {
        return 'Remux';
    } else if (session.TranscodingInfo?.IsVideoDirect) {
        return 'DirectStream';
    } else if (playMethod === PlayMethod.Transcode) {
        return 'Transcode';
    } else if (playMethod === PlayMethod.DirectStream || playMethod === PlayMethod.DirectPlay) {
        return 'DirectPlay';
    }

    return null;
}

export default {
    getDisplayPlayMethod: getDisplayPlayMethod
};
