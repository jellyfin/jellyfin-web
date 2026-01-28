import browser from '../browser';
import appSettings from '../settings/appSettings';
import * as userSettings from '../settings/userSettings';

import {
    canPlayAudioFormat,
    supportsAc3,
    supportsEac3,
    supportsAc3InHls,
    supportsMp3InHls,
    canPlayDts
} from './audioCodecs';
import { getMaxBitrate, getGlobalMaxVideoBitrate, getPhysicalAudioChannels } from './bitrate';
import {
    getDirectPlayProfileForVideoContainer,
    testCanPlayMkv,
    supportsMpeg2Video,
    supportsVc1
} from './containerSupport';
import {
    canPlayHls,
    canPlayNativeHls,
    canPlayNativeHlsInFmp4,
    supportsCanvas2D,
    supportsTextTracks,
    supportsAnamorphicVideo
} from './featureDetection';
import {
    supportsHdr10,
    supportsHlg,
    supportsDolbyVision,
    supportedDolbyVisionProfilesHevc,
    supportedDolbyVisionProfileAv1
} from './hdr';
import { canPlaySecondaryAudio } from './secondaryAudio';
import { canPlayH264, canPlayHevc, canPlayAv1 } from './videoCodecs';

export * from './audioCodecs';
export * from './bitrate';
export * from './containerSupport';
export * from './featureDetection';
export * from './hdr';
export * from './secondaryAudio';
export * from './videoCodecs';

export interface DeviceProfile {
    MaxStreamingBitrate: number;
    MaxStaticBitrate: number;
    MusicStreamingTranscodingBitrate: number;
    DirectPlayProfiles: any[];
    TranscodingProfiles: any[];
    ContainerProfiles: any[];
    CodecProfiles: any[];
    SubtitleProfiles: any[];
    ResponseProfiles: any[];
}

export function browserDeviceProfile(options: any = {}): DeviceProfile {
    const bitrateSetting = getMaxBitrate();
    const videoTestElement = document.createElement('video');
    const physicalAudioChannels = getPhysicalAudioChannels(options, videoTestElement);

    const canPlayVp8 = videoTestElement.canPlayType('video/webm; codecs="vp8"').replace(/no/, '');
    const canPlayVp9 = videoTestElement.canPlayType('video/webm; codecs="vp9"').replace(/no/, '');
    const safariSupportsOpus =
        browser.safari &&
        (browser as any).versionMajor >= 17 &&
        !!document.createElement('audio').canPlayType('audio/x-caf; codecs="opus"').replace(/no/, '');
    const webmAudioCodecs = ['vorbis'];

    const canPlayMkv = testCanPlayMkv(videoTestElement);

    const profile: DeviceProfile = {
        MaxStreamingBitrate: bitrateSetting,
        MaxStaticBitrate: 100000000,
        MusicStreamingTranscodingBitrate: Math.min(bitrateSetting, 384000),
        DirectPlayProfiles: [],
        TranscodingProfiles: [],
        ContainerProfiles: [],
        CodecProfiles: [],
        SubtitleProfiles: [],
        ResponseProfiles: []
    };

    let videoAudioCodecs: string[] = [];
    let hlsInTsVideoAudioCodecs: string[] = [];
    let hlsInFmp4VideoAudioCodecs: string[] = [];

    const supportsMp3VideoAudio =
        videoTestElement.canPlayType('video/mp4; codecs="avc1.640029, mp4a.69"').replace(/no/, '') ||
        videoTestElement.canPlayType('video/mp4; codecs="avc1.640029, mp4a.6B"').replace(/no/, '') ||
        videoTestElement.canPlayType('video/mp4; codecs="avc1.640029, mp3"').replace(/no/, '');

    let supportsMp2VideoAudio = options.supportsMp2VideoAudio;
    if (supportsMp2VideoAudio == null) {
        supportsMp2VideoAudio = (browser as any).edgeUwp || (browser as any).tizen || browser.web0s;

        if (
            supportsMp3VideoAudio &&
            (browser.chrome || browser.edgeChromium || (browser.firefox && (browser as any).versionMajor >= 83))
        ) {
            supportsMp2VideoAudio = true;
        }
        if (browser.android) {
            supportsMp2VideoAudio = false;
        }
    }

    const canPlayAacVideoAudio = videoTestElement
        .canPlayType('video/mp4; codecs="avc1.640029, mp4a.40.2"')
        .replace(/no/, '');
    const canPlayMp3VideoAudioInHls = supportsMp3InHls(videoTestElement);
    const canPlayAc3VideoAudio = supportsAc3(videoTestElement);
    const canPlayEac3VideoAudio = supportsEac3(videoTestElement);
    const canPlayAc3VideoAudioInHls = supportsAc3InHls(videoTestElement);

    if (canPlayAacVideoAudio) {
        videoAudioCodecs.push('aac');
        hlsInTsVideoAudioCodecs.push('aac');
        hlsInFmp4VideoAudioCodecs.push('aac');
    }

    if (supportsMp3VideoAudio) {
        videoAudioCodecs.push('mp3');
    }

    if (browser.safari || (supportsMp3VideoAudio && !(browser as any).ps4)) {
        hlsInTsVideoAudioCodecs.push('mp3');
    }

    if (canPlayMp3VideoAudioInHls) {
        hlsInFmp4VideoAudioCodecs.push('mp3');
    }

    if (canPlayAc3VideoAudio) {
        videoAudioCodecs.push('ac3');
        if (browser.edgeChromium) {
            hlsInFmp4VideoAudioCodecs.push('ac3');
        }

        if (canPlayEac3VideoAudio) {
            videoAudioCodecs.push('eac3');
            if (browser.edgeChromium) {
                hlsInFmp4VideoAudioCodecs.push('eac3');
            }
        }

        if (canPlayAc3VideoAudioInHls) {
            hlsInTsVideoAudioCodecs.push('ac3');
            hlsInFmp4VideoAudioCodecs.push('ac3');

            if (canPlayEac3VideoAudio) {
                hlsInTsVideoAudioCodecs.push('eac3');
                hlsInFmp4VideoAudioCodecs.push('eac3');
            }
        }
    }

    if (supportsMp2VideoAudio) {
        videoAudioCodecs.push('mp2');
        hlsInTsVideoAudioCodecs.push('mp2');
        hlsInFmp4VideoAudioCodecs.push('mp2');
    }

    let supportsDtsVal = appSettings.enableDts() || options.supportsDts;
    if (supportsDtsVal == null) {
        supportsDtsVal = canPlayDts(videoTestElement);
    }

    if (supportsDtsVal) {
        videoAudioCodecs.push('dca');
        videoAudioCodecs.push('dts');
    }

    if ((browser as any).tizen || browser.web0s) {
        videoAudioCodecs.push('pcm_s16le');
        videoAudioCodecs.push('pcm_s24le');
    }

    if (appSettings.enableTrueHd() || options.supportsTrueHd) {
        videoAudioCodecs.push('truehd');
    }

    if ((browser as any).tizen) {
        videoAudioCodecs.push('aac_latm');
    }

    if (canPlayAudioFormat('opus')) {
        videoAudioCodecs.push('opus');
        webmAudioCodecs.push('opus');
        if ((browser as any).tizen) {
            hlsInTsVideoAudioCodecs.push('opus');
        }
        hlsInFmp4VideoAudioCodecs.push('opus');
    } else if (safariSupportsOpus) {
        videoAudioCodecs.push('opus');
        webmAudioCodecs.push('opus');
        hlsInFmp4VideoAudioCodecs.push('opus');
    }

    if (canPlayAudioFormat('flac') && !(browser as any).tizen) {
        videoAudioCodecs.push('flac');
        hlsInFmp4VideoAudioCodecs.push('flac');
    }

    if (canPlayAudioFormat('alac')) {
        videoAudioCodecs.push('alac');
        hlsInFmp4VideoAudioCodecs.push('alac');
    }

    videoAudioCodecs = videoAudioCodecs.filter(c => {
        return (options.disableVideoAudioCodecs || []).indexOf(c) === -1;
    });

    hlsInTsVideoAudioCodecs = hlsInTsVideoAudioCodecs.filter(c => {
        return (options.disableHlsVideoAudioCodecs || []).indexOf(c) === -1;
    });

    hlsInFmp4VideoAudioCodecs = hlsInFmp4VideoAudioCodecs.filter(c => {
        return (options.disableHlsVideoAudioCodecs || []).indexOf(c) === -1;
    });

    const mp4VideoCodecs: string[] = [];
    const webmVideoCodecs: string[] = [];
    const hlsInTsVideoCodecs: string[] = [];
    const hlsInFmp4VideoCodecs: string[] = [];

    if (
        canPlayAv1(videoTestElement) &&
        (browser.safari ||
            (!browser.mobile && (browser.edgeChromium || browser.firefox || browser.chrome || (browser as any).opera)))
    ) {
        hlsInFmp4VideoCodecs.push('av1');
    }

    if (
        canPlayHevc(videoTestElement, options) &&
        (browser.edgeChromium ||
            browser.safari ||
            (browser as any).tizen ||
            browser.web0s ||
            (browser.chrome && (!browser.android || (browser as any).versionMajor >= 105)) ||
            ((browser as any).opera && !browser.mobile) ||
            (browser.firefox && (browser as any).versionMajor >= 134))
    ) {
        hlsInFmp4VideoCodecs.push('hevc');
    }

    if (canPlayH264(videoTestElement)) {
        mp4VideoCodecs.push('h264');
        hlsInTsVideoCodecs.push('h264');
        hlsInFmp4VideoCodecs.push('h264');
    }

    if (canPlayHevc(videoTestElement, options)) {
        mp4VideoCodecs.push('hevc');
        if ((browser as any).tizen || browser.web0s || (browser as any).vidaa) {
            hlsInTsVideoCodecs.push('hevc');
        }
    }

    if (supportsMpeg2Video()) {
        mp4VideoCodecs.push('mpeg2video');
    }

    if (supportsVc1(videoTestElement)) {
        mp4VideoCodecs.push('vc1');
    }

    if ((browser as any).tizen) {
        mp4VideoCodecs.push('msmpeg4v2');
    }

    if (canPlayVp8) {
        webmVideoCodecs.push('vp8');
    }

    if (canPlayVp9) {
        if (!(browser as any).iOS && !(browser.firefox && (browser as any).osx)) {
            mp4VideoCodecs.push('vp9');
        }
        if (browser.safari || browser.edgeChromium || browser.chrome || browser.firefox) {
            hlsInFmp4VideoCodecs.push('vp9');
        }
        if (
            !browser.safari ||
            (browser.safari && (browser as any).versionMajor >= 15 && (browser as any).versionMajor < 17)
        ) {
            webmVideoCodecs.push('vp9');
        }
    }

    if (canPlayAv1(videoTestElement)) {
        mp4VideoCodecs.push('av1');
        if (
            !browser.safari ||
            (browser.safari && (browser as any).versionMajor >= 15 && (browser as any).versionMajor < 17)
        ) {
            webmVideoCodecs.push('av1');
        }
    }

    if ((!browser.safari && canPlayVp8) || (browser as any).tizen) {
        videoAudioCodecs.push('vorbis');
    }

    if (webmVideoCodecs.length) {
        profile.DirectPlayProfiles.push({
            Container: 'webm',
            Type: 'Video',
            VideoCodec: webmVideoCodecs.join(','),
            AudioCodec: webmAudioCodecs.join(',')
        });
    }

    if (mp4VideoCodecs.length) {
        profile.DirectPlayProfiles.push({
            Container: 'mp4,m4v',
            Type: 'Video',
            VideoCodec: mp4VideoCodecs.join(','),
            AudioCodec: videoAudioCodecs.join(',')
        });
    }

    if (canPlayMkv && mp4VideoCodecs.length) {
        profile.DirectPlayProfiles.push({
            Container: 'mkv',
            Type: 'Video',
            VideoCodec: mp4VideoCodecs.join(','),
            AudioCodec: videoAudioCodecs.join(',')
        });
    }

    ['m2ts', 'wmv', 'ts', 'asf', 'avi', 'mpg', 'mpeg', 'flv', '3gp', 'mts', 'trp', 'vob', 'vro', 'mov']
        .map(container => {
            return getDirectPlayProfileForVideoContainer(container, videoAudioCodecs, videoTestElement, options);
        })
        .filter(i => {
            return i != null;
        })
        .forEach(i => {
            profile.DirectPlayProfiles.push(i);
        });

    ['opus', 'mp3', 'mp2', 'aac', 'flac', 'alac', 'webma', 'wma', 'wav', 'ogg', 'oga']
        .filter(canPlayAudioFormat)
        .forEach(audioFormat => {
            if (audioFormat === 'mp3' && !canPlayMp3VideoAudioInHls) {
                profile.DirectPlayProfiles.push({
                    Container: 'ts',
                    AudioCodec: 'mp3',
                    Type: 'Audio'
                });
            }

            if (audioFormat === 'flac' && appSettings.alwaysRemuxFlac()) {
                profile.DirectPlayProfiles.push({
                    Container: 'mp4',
                    AudioCodec: 'flac',
                    Type: 'Audio'
                });
            } else if (audioFormat !== 'mp3' || !appSettings.alwaysRemuxMp3()) {
                profile.DirectPlayProfiles.push({
                    Container: audioFormat,
                    Type: 'Audio'
                });
            }

            if (audioFormat === 'opus' || audioFormat === 'webma') {
                profile.DirectPlayProfiles.push({
                    Container: 'webm',
                    AudioCodec: audioFormat,
                    Type: 'Audio'
                });
            }

            if (audioFormat === 'aac' || audioFormat === 'alac') {
                profile.DirectPlayProfiles.push({
                    Container: 'm4a',
                    AudioCodec: audioFormat,
                    Type: 'Audio'
                });

                profile.DirectPlayProfiles.push({
                    Container: 'm4b',
                    AudioCodec: audioFormat,
                    Type: 'Audio'
                });
            }
        });

    if (safariSupportsOpus) {
        profile.DirectPlayProfiles.push({
            Container: 'mp4',
            AudioCodec: 'opus',
            Type: 'Audio'
        });
    }

    const hlsBreakOnNonKeyFrames =
        (browser as any).iOS || (browser as any).osx || (browser as any).edge || !canPlayNativeHls();
    let enableFmp4Hls = (userSettings as any).preferFmp4HlsContainer();
    if ((browser.safari || (browser as any).tizen || browser.web0s) && !canPlayNativeHlsInFmp4()) {
        enableFmp4Hls = false;
    }

    if (canPlayHls() && (browser as any).enableHlsAudio !== false) {
        profile.TranscodingProfiles.push({
            Container: enableFmp4Hls ? 'mp4' : 'ts',
            Type: 'Audio',
            AudioCodec: 'aac',
            Context: 'Streaming',
            Protocol: 'hls',
            MaxAudioChannels: physicalAudioChannels.toString(),
            MinSegments: (browser as any).iOS || (browser as any).osx ? '2' : '1',
            BreakOnNonKeyFrames: hlsBreakOnNonKeyFrames,
            EnableAudioVbrEncoding: !appSettings.disableVbrAudio()
        });
    }

    ['aac', 'mp3', 'opus', 'wav'].filter(canPlayAudioFormat).forEach(audioFormat => {
        profile.TranscodingProfiles.push({
            Container: audioFormat,
            Type: 'Audio',
            AudioCodec: audioFormat,
            Context: 'Streaming',
            Protocol: 'http',
            MaxAudioChannels: physicalAudioChannels.toString()
        });
    });

    ['opus', 'mp3', 'aac', 'wav'].filter(canPlayAudioFormat).forEach(audioFormat => {
        profile.TranscodingProfiles.push({
            Container: audioFormat,
            Type: 'Audio',
            AudioCodec: audioFormat,
            Context: 'Static',
            Protocol: 'http',
            MaxAudioChannels: physicalAudioChannels.toString()
        });
    });

    if (canPlayHls() && options.enableHls !== false) {
        const enableLimitedSegmentLength = (userSettings as any).limitSegmentLength();
        if (hlsInFmp4VideoCodecs.length && hlsInFmp4VideoAudioCodecs.length && enableFmp4Hls) {
            profile.DirectPlayProfiles.push({
                Container: 'hls',
                Type: 'Video',
                VideoCodec: hlsInFmp4VideoCodecs.join(','),
                AudioCodec: hlsInFmp4VideoAudioCodecs.join(',')
            });

            profile.TranscodingProfiles.push({
                Container: 'mp4',
                Type: 'Video',
                AudioCodec: hlsInFmp4VideoAudioCodecs.join(','),
                VideoCodec: hlsInFmp4VideoCodecs.join(','),
                Context: 'Streaming',
                Protocol: 'hls',
                MaxAudioChannels: physicalAudioChannels.toString(),
                MinSegments: (browser as any).iOS || (browser as any).osx ? '2' : '1',
                BreakOnNonKeyFrames: hlsBreakOnNonKeyFrames,
                SegmentLength: enableLimitedSegmentLength ? 1 : undefined
            });
        }

        if (hlsInTsVideoCodecs.length && hlsInTsVideoAudioCodecs.length) {
            profile.DirectPlayProfiles.push({
                Container: 'hls',
                Type: 'Video',
                VideoCodec: hlsInTsVideoCodecs.join(','),
                AudioCodec: hlsInTsVideoAudioCodecs.join(',')
            });

            profile.TranscodingProfiles.push({
                Container: 'ts',
                Type: 'Video',
                AudioCodec: hlsInTsVideoAudioCodecs.join(','),
                VideoCodec: hlsInTsVideoCodecs.join(','),
                Context: 'Streaming',
                Protocol: 'hls',
                MaxAudioChannels: physicalAudioChannels.toString(),
                MinSegments: (browser as any).iOS || (browser as any).osx ? '2' : '1',
                BreakOnNonKeyFrames: hlsBreakOnNonKeyFrames,
                SegmentLength: enableLimitedSegmentLength ? 1 : undefined
            });
        }
    }

    if ((browser as any).tizenVersion < 6.5) {
        profile.ContainerProfiles.push({
            Type: 'Video',
            Conditions: [
                {
                    Condition: 'LessThanEqual',
                    Property: 'NumStreams',
                    Value: '32',
                    IsRequired: false
                }
            ]
        });
    }

    const supportsSecondaryAudioVal = canPlaySecondaryAudio(videoTestElement);
    const aacCodecProfileConditions = [];

    if (!videoTestElement.canPlayType('video/mp4; codecs="avc1.640029, mp4a.40.5"').replace(/no/, '')) {
        aacCodecProfileConditions.push({
            Condition: 'NotEquals',
            Property: 'AudioProfile',
            Value: 'HE-AAC'
        });
    }

    if (!supportsSecondaryAudioVal) {
        aacCodecProfileConditions.push({
            Condition: 'Equals',
            Property: 'IsSecondaryAudio',
            Value: 'false',
            IsRequired: false
        });
    }

    if (aacCodecProfileConditions.length) {
        profile.CodecProfiles.push({
            Type: 'VideoAudio',
            Codec: 'aac',
            Conditions: aacCodecProfileConditions
        });
    }

    const globalAudioCodecProfileConditions = [];
    const globalVideoAudioCodecProfileConditions = [];

    if (parseInt((userSettings as any).allowedAudioChannels(), 10) > 0) {
        globalAudioCodecProfileConditions.push({
            Condition: 'LessThanEqual',
            Property: 'AudioChannels',
            Value: physicalAudioChannels.toString(),
            IsRequired: false
        });

        globalVideoAudioCodecProfileConditions.push({
            Condition: 'LessThanEqual',
            Property: 'AudioChannels',
            Value: physicalAudioChannels.toString(),
            IsRequired: false
        });
    }

    if (!supportsSecondaryAudioVal) {
        globalVideoAudioCodecProfileConditions.push({
            Condition: 'Equals',
            Property: 'IsSecondaryAudio',
            Value: 'false',
            IsRequired: false
        });
    }

    if (globalAudioCodecProfileConditions.length) {
        profile.CodecProfiles.push({
            Type: 'Audio',
            Conditions: globalAudioCodecProfileConditions
        });
    }

    if (globalVideoAudioCodecProfileConditions.length) {
        profile.CodecProfiles.push({
            Type: 'VideoAudio',
            Conditions: globalVideoAudioCodecProfileConditions
        });
    }

    if (browser.web0s) {
        const flacConditions = [
            {
                Condition: 'LessThanEqual',
                Property: 'AudioChannels',
                Value: '2',
                IsRequired: false
            }
        ];

        profile.CodecProfiles.push({
            Type: 'VideoAudio',
            Codec: 'flac',
            Conditions: flacConditions
        });

        const flacTranscodingProfiles: any[] = [];

        profile.TranscodingProfiles.forEach(transcodingProfile => {
            if (transcodingProfile.Type !== 'Video') return;

            const audioCodecs = (transcodingProfile.AudioCodec as string).split(',');

            if (!audioCodecs.includes('flac')) return;

            const flacTranscodingProfile = { ...transcodingProfile };
            flacTranscodingProfile.AudioCodec = 'flac';
            flacTranscodingProfile.ApplyConditions = [
                ...(flacTranscodingProfile.ApplyConditions || []),
                ...flacConditions
            ];

            flacTranscodingProfiles.push(flacTranscodingProfile);

            transcodingProfile.AudioCodec = audioCodecs.filter(codec => codec !== 'flac').join(',');
        });

        profile.TranscodingProfiles.push(...flacTranscodingProfiles);
    }

    if (safariSupportsOpus) {
        const opusConditions = [
            {
                Condition: 'LessThanEqual',
                Property: 'AudioChannels',
                Value: '2',
                IsRequired: false
            }
        ];

        profile.CodecProfiles.push({
            Type: 'VideoAudio',
            Codec: 'opus',
            Conditions: opusConditions
        });

        const opusTranscodingProfiles: any[] = [];

        profile.TranscodingProfiles.forEach(transcodingProfile => {
            if (transcodingProfile.Type !== 'Video') return;

            const audioCodecs = (transcodingProfile.AudioCodec as string).split(',');

            if (!audioCodecs.includes('opus')) return;

            const opusTranscodingProfile = { ...transcodingProfile };
            opusTranscodingProfile.AudioCodec = 'opus';
            opusTranscodingProfile.ApplyConditions = [
                ...(opusTranscodingProfile.ApplyConditions || []),
                ...opusConditions
            ];

            opusTranscodingProfiles.push(opusTranscodingProfile);

            transcodingProfile.AudioCodec = audioCodecs.filter(codec => codec !== 'opus').join(',');
        });

        profile.TranscodingProfiles.push(...opusTranscodingProfiles);
    }

    let maxH264Level = 42;
    let h264Profiles = 'high|main|baseline|constrained baseline';

    if (
        (browser as any).tizen ||
        browser.web0s ||
        videoTestElement.canPlayType('video/mp4; codecs="avc1.640833"').replace(/no/, '')
    ) {
        maxH264Level = 51;
    }

    if (
        ((browser as any).tizenVersion >= 5 && (window as any).NativeShell) ||
        videoTestElement.canPlayType('video/mp4; codecs="avc1.640834"').replace(/no/, '')
    ) {
        maxH264Level = 52;
    }

    if (
        videoTestElement.canPlayType('video/mp4; codecs="avc1.6e0033"').replace(/no/, '') &&
        !browser.safari &&
        !browser.iOS &&
        !browser.web0s &&
        !(browser as any).edge &&
        !browser.mobile &&
        !(browser as any).tizen
    ) {
        h264Profiles += '|high 10';
    }

    let maxHevcLevel = 120;
    let hevcProfiles = 'main';

    if (
        videoTestElement.canPlayType('video/mp4; codecs="hvc1.1.4.L123"').replace(/no/, '') ||
        videoTestElement.canPlayType('video/mp4; codecs="hev1.1.4.L123"').replace(/no/, '')
    ) {
        maxHevcLevel = 123;
    }

    if (
        videoTestElement.canPlayType('video/mp4; codecs="hvc1.2.4.L123"').replace(/no/, '') ||
        videoTestElement.canPlayType('video/mp4; codecs="hev1.2.4.L123"').replace(/no/, '')
    ) {
        maxHevcLevel = 123;
        hevcProfiles = 'main|main 10';
    }

    if (
        videoTestElement.canPlayType('video/mp4; codecs="hvc1.2.4.L153"').replace(/no/, '') ||
        videoTestElement.canPlayType('video/mp4; codecs="hev1.2.4.L153"').replace(/no/, '')
    ) {
        maxHevcLevel = 153;
        hevcProfiles = 'main|main 10';
    }

    if (
        videoTestElement.canPlayType('video/mp4; codecs="hvc1.2.4.L183"').replace(/no/, '') ||
        videoTestElement.canPlayType('video/mp4; codecs="hev1.2.4.L183"').replace(/no/, '')
    ) {
        maxHevcLevel = 183;
        hevcProfiles = 'main|main 10';
    }

    if (
        videoTestElement.canPlayType('video/mp4; codecs="hvc1.2.4.L186"').replace(/no/, '') ||
        videoTestElement.canPlayType('video/mp4; codecs="hev1.2.4.L186"').replace(/no/, '')
    ) {
        maxHevcLevel = 186;
        hevcProfiles = 'main|main 10';
    }

    let maxAv1Level = 15;
    const av1Profiles = 'main';

    if (
        videoTestElement.canPlayType('video/mp4; codecs="av01.0.16M.08"').replace(/no/, '') &&
        videoTestElement.canPlayType('video/mp4; codecs="av01.0.16M.10"').replace(/no/, '')
    ) {
        maxAv1Level = 16;
    }

    if (
        videoTestElement.canPlayType('video/mp4; codecs="av01.0.17M.08"').replace(/no/, '') &&
        videoTestElement.canPlayType('video/mp4; codecs="av01.0.17M.10"').replace(/no/, '')
    ) {
        maxAv1Level = 17;
    }

    if (
        videoTestElement.canPlayType('video/mp4; codecs="av01.0.18M.08"').replace(/no/, '') &&
        videoTestElement.canPlayType('video/mp4; codecs="av01.0.18M.10"').replace(/no/, '')
    ) {
        maxAv1Level = 18;
    }

    if (
        videoTestElement.canPlayType('video/mp4; codecs="av01.0.19M.08"').replace(/no/, '') &&
        videoTestElement.canPlayType('video/mp4; codecs="av01.0.19M.10"').replace(/no/, '')
    ) {
        maxAv1Level = 19;
    }

    const h264VideoRangeTypes = 'SDR';
    let hevcVideoRangeTypes = 'SDR';
    let vp9VideoRangeTypes = 'SDR';
    let av1VideoRangeTypes = 'SDR';

    if ((browser as any).tizenVersion >= 3) {
        hevcVideoRangeTypes += '|DOVIWithSDR';
    }

    if (supportsHdr10(options)) {
        hevcVideoRangeTypes += '|HDR10|HDR10Plus';
        vp9VideoRangeTypes += '|HDR10|HDR10Plus';
        av1VideoRangeTypes += '|HDR10|HDR10Plus';

        if ((browser as any).tizenVersion >= 3 || (browser as any).vidaa) {
            hevcVideoRangeTypes += '|DOVIWithHDR10|DOVIWithHDR10Plus|DOVIWithEL|DOVIWithELHDR10Plus|DOVIInvalid';
            av1VideoRangeTypes += '|DOVIWithHDR10|DOVIWithHDR10Plus|DOVIWithEL|DOVIWithELHDR10Plus|DOVIInvalid';
        }
    }

    if (supportsHlg(options)) {
        hevcVideoRangeTypes += '|HLG';
        vp9VideoRangeTypes += '|HLG';
        av1VideoRangeTypes += '|HLG';

        if ((browser as any).tizenVersion >= 3) {
            hevcVideoRangeTypes += '|DOVIWithHLG';
        }
    }

    if (supportsDolbyVision(options)) {
        const profiles = supportedDolbyVisionProfilesHevc(videoTestElement);
        if (profiles.includes(5)) {
            hevcVideoRangeTypes += '|DOVI';
        }
        if (profiles.includes(8)) {
            hevcVideoRangeTypes += '|DOVIWithHDR10|DOVIWithHLG|DOVIWithSDR|DOVIWithHDR10Plus';
        }

        if (browser.web0s) {
            hevcVideoRangeTypes += '|DOVIWithEL|DOVIWithELHDR10Plus|DOVIInvalid';
        }

        if (supportedDolbyVisionProfileAv1(videoTestElement)) {
            av1VideoRangeTypes += '|DOVI|DOVIWithHDR10|DOVIWithHLG|DOVIWithSDR|DOVIWithHDR10Plus';
            if (browser.web0s) {
                av1VideoRangeTypes += '|DOVIWithEL|DOVIWithELHDR10Plus|DOVIInvalid';
            }
        }
    }

    const h264CodecProfileConditions = [
        {
            Condition: 'EqualsAny',
            Property: 'VideoProfile',
            Value: h264Profiles,
            IsRequired: false
        },
        {
            Condition: 'EqualsAny',
            Property: 'VideoRangeType',
            Value: h264VideoRangeTypes,
            IsRequired: false
        },
        {
            Condition: 'LessThanEqual',
            Property: 'VideoLevel',
            Value: maxH264Level.toString(),
            IsRequired: false
        }
    ];

    const hevcCodecProfileConditions = [
        {
            Condition: 'EqualsAny',
            Property: 'VideoProfile',
            Value: hevcProfiles,
            IsRequired: false
        },
        {
            Condition: 'EqualsAny',
            Property: 'VideoRangeType',
            Value: hevcVideoRangeTypes,
            IsRequired: false
        },
        {
            Condition: 'LessThanEqual',
            Property: 'VideoLevel',
            Value: maxHevcLevel.toString(),
            IsRequired: false
        }
    ];

    const vp9CodecProfileConditions = [
        {
            Condition: 'EqualsAny',
            Property: 'VideoRangeType',
            Value: vp9VideoRangeTypes,
            IsRequired: false
        }
    ];

    const av1CodecProfileConditions = [
        {
            Condition: 'EqualsAny',
            Property: 'VideoProfile',
            Value: av1Profiles,
            IsRequired: false
        },
        {
            Condition: 'EqualsAny',
            Property: 'VideoRangeType',
            Value: av1VideoRangeTypes,
            IsRequired: false
        },
        {
            Condition: 'LessThanEqual',
            Property: 'VideoLevel',
            Value: maxAv1Level.toString(),
            IsRequired: false
        }
    ];

    if (!supportsAnamorphicVideo()) {
        h264CodecProfileConditions.push({
            Condition: 'NotEquals',
            Property: 'IsAnamorphic',
            Value: 'true',
            IsRequired: false
        });

        hevcCodecProfileConditions.push({
            Condition: 'NotEquals',
            Property: 'IsAnamorphic',
            Value: 'true',
            IsRequired: false
        });

        av1CodecProfileConditions.push({
            Condition: 'NotEquals',
            Property: 'IsAnamorphic',
            Value: 'true',
            IsRequired: false
        });
    }

    if (!(browser as any).edgeUwp && !(browser as any).tizen && !browser.web0s) {
        h264CodecProfileConditions.push({
            Condition: 'NotEquals',
            Property: 'IsInterlaced',
            Value: 'true',
            IsRequired: false
        });

        hevcCodecProfileConditions.push({
            Condition: 'NotEquals',
            Property: 'IsInterlaced',
            Value: 'true',
            IsRequired: false
        });
    }

    const maxVideoWidthStr = (options.maxVideoWidth || '').toString();
    if (maxVideoWidthStr) {
        h264CodecProfileConditions.push({
            Condition: 'LessThanEqual',
            Property: 'Width',
            Value: maxVideoWidthStr,
            IsRequired: false
        });

        hevcCodecProfileConditions.push({
            Condition: 'LessThanEqual',
            Property: 'Width',
            Value: maxVideoWidthStr,
            IsRequired: false
        });

        av1CodecProfileConditions.push({
            Condition: 'LessThanEqual',
            Property: 'Width',
            Value: maxVideoWidthStr,
            IsRequired: false
        });
    }

    const globalMaxVideoBitrateStr = (getGlobalMaxVideoBitrate() || '').toString();

    if (globalMaxVideoBitrateStr) {
        h264CodecProfileConditions.push({
            Condition: 'LessThanEqual',
            Property: 'VideoBitrate',
            Value: globalMaxVideoBitrateStr,
            IsRequired: true
        });
        hevcCodecProfileConditions.push({
            Condition: 'LessThanEqual',
            Property: 'VideoBitrate',
            Value: globalMaxVideoBitrateStr,
            IsRequired: true
        });
        av1CodecProfileConditions.push({
            Condition: 'LessThanEqual',
            Property: 'VideoBitrate',
            Value: globalMaxVideoBitrateStr,
            IsRequired: true
        });
    }

    if (browser.safari) {
        hevcCodecProfileConditions.push({
            Condition: 'EqualsAny',
            Property: 'VideoCodecTag',
            Value: 'hvc1|dvh1',
            IsRequired: true
        });

        hevcCodecProfileConditions.push({
            Condition: 'LessThanEqual',
            Property: 'VideoFramerate',
            Value: '60',
            IsRequired: true
        });
    }

    profile.CodecProfiles.push({
        Type: 'Video',
        Codec: 'h264',
        Conditions: h264CodecProfileConditions
    });

    profile.CodecProfiles.push({
        Type: 'Video',
        Codec: 'hevc',
        Conditions: hevcCodecProfileConditions
    });

    profile.CodecProfiles.push({
        Type: 'Video',
        Codec: 'vp9',
        Conditions: vp9CodecProfileConditions
    });

    profile.CodecProfiles.push({
        Type: 'Video',
        Codec: 'av1',
        Conditions: av1CodecProfileConditions
    });

    profile.SubtitleProfiles = [];
    const subtitleBurninSetting = appSettings.get('subtitleburnin');
    const subtitleRenderPgsSetting = appSettings.get('subtitlerenderpgs') === 'true';
    if (subtitleBurninSetting !== 'all') {
        if (supportsTextTracks()) {
            profile.SubtitleProfiles.push({
                Format: 'vtt',
                Method: 'External'
            });
        }
        if (options.enableSsaRender !== false && !options.isRetry && subtitleBurninSetting !== 'allcomplexformats') {
            profile.SubtitleProfiles.push({
                Format: 'ass',
                Method: 'External'
            });
            profile.SubtitleProfiles.push({
                Format: 'ssa',
                Method: 'External'
            });
        }

        if (
            supportsCanvas2D() &&
            options.enablePgsRender !== false &&
            !options.isRetry &&
            subtitleRenderPgsSetting &&
            subtitleBurninSetting !== 'allcomplexformats' &&
            subtitleBurninSetting !== 'onlyimageformats'
        ) {
            profile.SubtitleProfiles.push({
                Format: 'pgssub',
                Method: 'External'
            });
        }
    }

    profile.ResponseProfiles.push({
        Type: 'Video',
        Container: 'm4v',
        MimeType: 'video/mp4'
    });

    return profile;
}

export default browserDeviceProfile;
