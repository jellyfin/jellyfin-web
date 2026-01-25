export interface PlaybackSession {
    NowPlayingItem?: any;
    TranscodingInfo?: {
        IsVideoDirect?: boolean;
        IsAudioDirect?: boolean;
        VideoCodec?: string | null;
    };
    PlayState?: {
        PlayMethod?: 'Transcode' | 'DirectStream' | 'DirectPlay';
    };
}

export function getDisplayPlayMethod(session: PlaybackSession): string | null {
    if (!session.NowPlayingItem) {
        return null;
    }

    if (
        (session.TranscodingInfo?.IsVideoDirect || !session.TranscodingInfo?.VideoCodec) &&
        session.TranscodingInfo?.IsAudioDirect
    ) {
        return 'Remux';
    } else if (session.TranscodingInfo?.IsVideoDirect) {
        return 'DirectStream';
    } else if (session.PlayState?.PlayMethod === 'Transcode') {
        return 'Transcode';
    } else if (session.PlayState?.PlayMethod === 'DirectStream') {
        return 'DirectPlay';
    } else if (session.PlayState?.PlayMethod === 'DirectPlay') {
        return 'DirectPlay';
    }

    return null;
}

export default {
    getDisplayPlayMethod: getDisplayPlayMethod
};
