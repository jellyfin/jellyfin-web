import datetime from '../../scripts/datetime';
import globalize from '../../lib/globalize';
import itemHelper from '../itemHelper';

export function getResolutionText(item: any): string | null {
    const width = item.Width;
    const height = item.Height;

    if (width && height) {
        if (width >= 3800 || height >= 2000) return '4K';
        if (width >= 2500 || height >= 1400) return item.IsInterlaced ? '1440i' : '1440p';
        if (width >= 1800 || height >= 1000) return item.IsInterlaced ? '1080i' : '1080p';
        if (width >= 1200 || height >= 700) return item.IsInterlaced ? '720i' : '720p';
        if (width >= 700 || height >= 400) return item.IsInterlaced ? '480i' : '480p';
    }
    return null;
}

export function getEndsAtFromPosition(runtimeTicks: number, positionTicks: number, playbackRate: number, includeText: boolean = true): string {
    let endDate = new Date().getTime() + (1 / playbackRate) * ((runtimeTicks - (positionTicks || 0)) / 10000);
    const displayTime = datetime.getDisplayTime(new Date(endDate));
    return includeText ? globalize.translate('EndsAtValue', displayTime) : displayTime;
}

export function getMediaInfoStats(item: any): any[] {
    const list: any[] = [];
    const mediaSource = (item.MediaSources || [])[0] || {};
    const videoStream = (mediaSource.MediaStreams || []).find((i: any) => i.Type === 'Video') || {};
    const audioStream = (mediaSource.MediaStreams || []).find((i: any) => i.Type === 'Audio' && (i.Index === mediaSource.DefaultAudioStreamIndex || mediaSource.DefaultAudioStreamIndex == null)) || {};

    if (item.VideoType === 'Dvd') list.push({ type: 'mediainfo', text: 'Dvd' });
    if (item.VideoType === 'BluRay') list.push({ type: 'mediainfo', text: 'BluRay' });

    const resolutionText = getResolutionText(videoStream);
    if (resolutionText) list.push({ type: 'mediainfo', text: resolutionText });
    if (videoStream.Codec) list.push({ type: 'mediainfo', text: videoStream.Codec });

    const channels = audioStream.Channels;
    let channelText = '';
    if (channels === 8) channelText = '7.1';
    else if (channels === 7) channelText = '6.1';
    else if (channels === 6) channelText = '5.1';
    else if (channels === 2) channelText = '2.0';
    if (channelText) list.push({ type: 'mediainfo', text: channelText });

    const audioCodec = (audioStream.Codec || '').toLowerCase();
    if ((audioCodec === 'dca' || audioCodec === 'dts') && audioStream.Profile) {
        list.push({ type: 'mediainfo', text: audioStream.Profile });
    } else if (audioStream.Codec) {
        list.push({ type: 'mediainfo', text: audioStream.Codec });
    }

    if (item.DateCreated && (itemHelper as any).enableDateAddedDisplay(item)) {
        const dateCreated = datetime.parseISO8601Date(item.DateCreated);
        list.push({
            type: 'added',
            text: globalize.translate('AddedOnValue', `${datetime.toLocaleDateString(dateCreated)} ${datetime.getDisplayTime(dateCreated)}`)
        });
    }

    return list;
}

const mediainfo = {
    getResolutionText,
    getEndsAtFromPosition,
    getMediaInfoStats
};

export default mediainfo;
