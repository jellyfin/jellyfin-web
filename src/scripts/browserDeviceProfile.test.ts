import { afterEach, describe, expect, it, vi } from 'vitest';

type VideoDirectPlayProfile = {
    Type?: string;
    Container?: string;
    AudioCodec?: string;
};

type VideoTranscodingProfile = {
    Type?: string;
    Container?: string;
    Protocol?: string;
    VideoCodec?: string;
    AudioCodec?: string;
};

type BrowserDeviceProfile = {
    DirectPlayProfiles: VideoDirectPlayProfile[];
    TranscodingProfiles?: VideoTranscodingProfile[];
};

vi.mock('./browser', () => ({
    default: {
        edgeChromium: true,
        windows: true,
        versionMajor: 142
    }
}));

vi.mock('./settings/appSettings', () => ({
    default: {
        enableDts: () => false,
        enableTrueHd: () => true,
        alwaysRemuxFlac: () => false,
        alwaysRemuxMp3: () => false,
        disableVbrAudio: () => false,
        enableHi10p: () => false,
        get: () => null
    }
}));

vi.mock('./settings/userSettings', () => ({
    allowedAudioChannels: () => '0',
    preferFmp4HlsContainer: () => true,
    limitSegmentLength: () => false
}));

function mockCanPlayType(type: string) {
    if (
        type.includes('video/mp4')
        || type.includes('video/x-matroska')
        || type.includes('video/mkv')
        || type.includes('application/x-mpegURL')
        || type.includes('application/vnd.apple.mpegURL')
        || type.includes('audio/mp4; codecs="ac-3"')
        || type.includes('audio/mp4; codecs="ec-3"')
        || type.includes('audio/ogg; codecs="opus"')
        || type.startsWith('audio/flac')
        || type.startsWith('audio/alac')
    ) {
        return 'probably';
    }

    return '';
}

describe('browserDeviceProfile', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('does not advertise truehd for plain Edge browser playback', async () => {
        vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockImplementation(mockCanPlayType);

        const { default: buildDeviceProfile } = await import('./browserDeviceProfile');
        const profile = buildDeviceProfile({}) as BrowserDeviceProfile;
        const directPlayProfiles = profile.DirectPlayProfiles;
        const videoProfiles = directPlayProfiles.filter((directPlayProfile) => directPlayProfile.Type === 'Video');

        expect(videoProfiles.some((directPlayProfile) => (directPlayProfile.AudioCodec || '').split(',').includes('truehd'))).toBe(false);
    });

    it('keeps truehd available when explicitly reported by the host', async () => {
        vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockImplementation(mockCanPlayType);

        const { default: buildDeviceProfile } = await import('./browserDeviceProfile');
        const profile = buildDeviceProfile({ supportsTrueHd: true }) as BrowserDeviceProfile;
        const directPlayProfiles = profile.DirectPlayProfiles;
        const mkvProfile = directPlayProfiles.find((directPlayProfile) => directPlayProfile.Type === 'Video' && directPlayProfile.Container === 'mkv');

        expect(mkvProfile?.AudioCodec?.split(',') ?? []).toContain('truehd');
    });

    it('prefers progressive hevc video transcode on Edge Windows HDR clients', async () => {
        vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockImplementation(mockCanPlayType);

        const { default: buildDeviceProfile } = await import('./browserDeviceProfile');
        const profile = buildDeviceProfile({}) as BrowserDeviceProfile;
        const transcodingProfiles = profile.TranscodingProfiles || [];
        const httpHevcProfile = transcodingProfiles.find((transcodingProfile) => transcodingProfile.Type === 'Video'
            && transcodingProfile.Protocol === 'http'
            && transcodingProfile.Container === 'mp4'
            && transcodingProfile.VideoCodec === 'hevc');

        expect(httpHevcProfile?.AudioCodec?.split(',') ?? []).toContain('aac');
    });
});
