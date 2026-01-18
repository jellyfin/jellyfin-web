import browser from '../../../scripts/browser';
import htmlMediaHelper from '../../../components/htmlMediaHelper';
import { playbackManager } from '../../../components/playback/playbackmanager';
import itemHelper from '../../../components/itemHelper';

export function isHls(mediaSource) {
    return htmlMediaHelper.enableHlsPlayer(mediaSource.TranscodingUrl);
}

export function enableNativeTrackSupport(mediaSource, track) {
    if (track?.DeliveryMethod === 'Embed') {
        return true;
    }

    if (browser.firefox && isHls(mediaSource)) {
        return false;
    }

    if (browser.ps4) {
        return false;
    }

    if (browser.web0s) {
        return false;
    }

    // Edge is randomly not rendering subtitles
    if (browser.edge) {
        return false;
    }

    if (browser.iOS && (browser.iosVersion || 10) < 10) {
        // works in ios browser but not in native app
        return false;
    }

    if (track) {
        const format = (track.Codec || '').toLowerCase();
        if (format === 'ssa' || format === 'ass' || format === 'pgssub') {
            return false;
        }
    }

    return true;
}

export function requireHlsPlayer(callback) {
    import('hls.js/dist/hls.js').then(({ default: hls }) => {
        hls.DefaultConfig.lowLatencyMode = false;
        hls.DefaultConfig.backBufferLength = Infinity;
        hls.DefaultConfig.liveBackBufferLength = 90;
        window.Hls = hls;
        callback();
    });
}

export function getMediaStreamVideoTracks(mediaSource) {
    return mediaSource.MediaStreams.filter((s) => {
        return s.Type === 'Video';
    });
}

export function getMediaStreamAudioTracks(mediaSource) {
    return mediaSource.MediaStreams.filter((s) => {
        return s.Type === 'Audio';
    });
}

export function getMediaStreamTextTracks(mediaSource) {
    return mediaSource.MediaStreams.filter((s) => {
        return s.Type === 'Subtitle';
    });
}

export function getTextTrackUrl(track, item, format) {
    if (itemHelper.isLocalItem(item) && track.Path) {
        return track.Path;
    }

    let url = playbackManager.getSubtitleUrl(track, item.ServerId);
    if (format) {
        url = url.replace('.vtt', format);
    }

    return url;
}
