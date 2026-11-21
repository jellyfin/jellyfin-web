import type { SessionInfoDto } from '@jellyfin/sdk/lib/generated-client/models/session-info-dto';
import { PlayMethod } from '@jellyfin/sdk/lib/generated-client/models/play-method';
import type { Nullable } from '@/types/nullable';

export type DisplayPlayMethod =
    | 'Remux'
    | 'DirectStream'
    | 'Transcode'
    | 'DirectPlay';

export function getDisplayPlayMethod(
    session: SessionInfoDto
): Nullable<DisplayPlayMethod> {
    if (!session.NowPlayingItem) {
        return null;
    }

    const transcodingInfo = session.TranscodingInfo;

    if (transcodingInfo) {
        if (
            (transcodingInfo.IsVideoDirect
                || !transcodingInfo.VideoCodec)
            && transcodingInfo.IsAudioDirect
        ) {
            return 'Remux';
        } else if (transcodingInfo.IsVideoDirect) {
            return 'DirectStream';
        }
    }

    const playMethod = session.PlayState?.PlayMethod;

    if (playMethod === PlayMethod.Transcode) {
        return 'Transcode';
    } else if (
        playMethod === PlayMethod.DirectStream
        || playMethod === PlayMethod.DirectPlay
    ) {
        return 'DirectPlay';
    }

    return null;
}

export default {
    getDisplayPlayMethod
};
