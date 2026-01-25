import type { SessionInfo } from '@jellyfin/sdk/lib/generated-client/models/session-info';
import playmethodhelper from 'components/playback/playmethodhelper';
import globalize from 'lib/globalize';

// eslint-disable-next-line sonarjs/cognitive-complexity
const getSessionNowPlayingStreamInfo = (session: SessionInfo): string => {
    let text = '';
    let showTranscodingInfo = false;
    const displayPlayMethod = playmethodhelper.getDisplayPlayMethod(session);

    if (displayPlayMethod === 'DirectPlay') {
        text += globalize.translate('DirectPlaying');
    } else if (displayPlayMethod === 'Remux') {
        text += globalize.translate('Remuxing');
    } else if (displayPlayMethod === 'DirectStream') {
        text += globalize.translate('DirectStreaming');
    } else if (displayPlayMethod === 'Transcode') {
        if (session.TranscodingInfo?.Framerate) {
            text += `${globalize.translate('Framerate')}: ${session.TranscodingInfo.Framerate}fps`;
        }

        showTranscodingInfo = true;
    }

    if (showTranscodingInfo) {
        const line = [];

        if (session.TranscodingInfo) {
            if (session.TranscodingInfo.Bitrate) {
                if (session.TranscodingInfo.Bitrate > 1e6) {
                    line.push((session.TranscodingInfo.Bitrate / 1e6).toFixed(1) + ' Mbps');
                } else {
                    line.push(Math.floor(session.TranscodingInfo.Bitrate / 1e3) + ' Kbps');
                }
            }

            if (session.TranscodingInfo.Container) {
                line.push(session.TranscodingInfo.Container.toUpperCase());
            }

            if (session.TranscodingInfo.VideoCodec) {
                line.push(session.TranscodingInfo.VideoCodec.toUpperCase());
            }

            if (
                session.TranscodingInfo.AudioCodec &&
                session.TranscodingInfo.AudioCodec !== session.TranscodingInfo.Container
            ) {
                line.push(session.TranscodingInfo.AudioCodec.toUpperCase());
            }
        }

        if (line.length) {
            text += '\n\n' + line.join(' ');
        }
    }

    return text;
};

export default getSessionNowPlayingStreamInfo;
