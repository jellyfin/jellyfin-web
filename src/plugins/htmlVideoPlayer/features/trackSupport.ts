import browser from '../../../scripts/browser';
import { enableHlsJsPlayer } from '../../../components/htmlMediaHelper';
import { playbackManager } from '../../../components/playback/playbackmanager';
import itemHelper from '../../../components/itemHelper';

export function isHls(mediaSource: any): boolean {
    return mediaSource?.TranscodingUrl?.includes('.m3u8') && enableHlsJsPlayer(mediaSource.RunTimeTicks, 'Video');
}

export function enableNativeTrackSupport(mediaSource: any, track: any): boolean {
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

    if (browser.iOS && ((browser as any).iosVersion || 10) < 10) {
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

declare const Hls: any;

export function requireHlsPlayer(callback: () => void): void {
    import('hls.js/dist/hls.js').then(({ default: hls }: any) => {
        hls.DefaultConfig.lowLatencyMode = false;
        hls.DefaultConfig.backBufferLength = Infinity;
        hls.DefaultConfig.liveBackBufferLength = 90;
        (window as any).Hls = hls;
        callback();
    });
}

export function getMediaStreamVideoTracks(mediaSource: any): any[] {
    return (mediaSource.MediaStreams || []).filter((s: any) => s.Type === 'Video');
}

export function getMediaStreamAudioTracks(mediaSource: any): any[] {
    return (mediaSource.MediaStreams || []).filter((s: any) => s.Type === 'Audio');
}

export function getMediaStreamTextTracks(mediaSource: any): any[] {
    return (mediaSource.MediaStreams || []).filter((s: any) => s.Type === 'Subtitle');
}

export function getTextTrackUrl(track: any, item: any, format?: string): string {
    if (itemHelper.isLocalItem(item) && track.Path) {
        return track.Path;
    }

    let url = playbackManager.getSubtitleUrl({
        track: track,
        serverId: item.ServerId
    });

    if (url === null) {
        return '';
    }

    if (format !== undefined && format !== '') {
        url = url.replace('.vtt', format);
    }

    return url;
}
