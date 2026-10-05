import type { DeviceProfile } from '@jellyfin/sdk/lib/generated-client/models/device-profile';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const browser = vi.hoisted(() => ({
    web0s: true,
    web0sVersion: 22,
    safari: false,
    chrome: false
}));

vi.mock('../scripts/browser', () => ({ default: browser }));
vi.mock('../scripts/settings/appSettings', () => ({
    default: {
        enableDts: () => false,
        enableTrueHd: () => false,
        alwaysRemuxFlac: () => false,
        alwaysRemuxMp3: () => false,
        disableVbrAudio: () => false,
        enableHi10p: () => false,
        get: () => undefined
    }
}));
vi.mock('../scripts/settings/userSettings', () => ({
    allowedAudioChannels: () => '6',
    preferFmp4HlsContainer: () => true,
    limitSegmentLength: () => false
}));

import getDeviceProfile from '../scripts/browserDeviceProfile';

describe('webOS Dolby Vision MP4 codec tags', () => {
    beforeEach(() => {
        browser.web0s = true;
        browser.safari = false;
        vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockReturnValue('probably');
        vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    });

    it('requires hvc1 or hev1 only for the HDR10-compatible Dolby Vision range in MP4', () => {
        const profiles = (getDeviceProfile({ supportsDolbyVision: true }) as DeviceProfile).CodecProfiles || [];
        const condition = profiles.find(p => p.Codec === 'hevc' && p.Container === 'mp4');

        expect(condition).toEqual({
            Type: 'Video',
            Codec: 'hevc',
            Container: 'mp4',
            ApplyConditions: [{
                Condition: 'Equals',
                Property: 'VideoRangeType',
                Value: 'DOVIWithHDR10',
                IsRequired: true
            }],
            Conditions: [{
                Condition: 'EqualsAny',
                Property: 'VideoCodecTag',
                Value: 'hvc1|hev1',
                IsRequired: false
            }]
        });
        expect(profiles.some(p => p.Codec === 'hevc' && p.Container === 'ts')).toBe(false);
    });

    it('does not restrict tags on webOS without Dolby Vision', () => {
        const profiles = (getDeviceProfile({ supportsDolbyVision: false }) as DeviceProfile).CodecProfiles || [];
        expect(profiles.some(p => p.Codec === 'hevc' && p.Container === 'mp4')).toBe(false);
    });

    it('does not replace Safari codec tag support', () => {
        browser.web0s = false;
        browser.safari = true;
        const profiles = (getDeviceProfile({ supportsDolbyVision: true }) as DeviceProfile).CodecProfiles || [];
        const conditions = profiles.find(p => p.Codec === 'hevc' && !p.Container)?.Conditions;
        expect(conditions).toContainEqual({
            Condition: 'EqualsAny',
            Property: 'VideoCodecTag',
            Value: 'hvc1|dvh1',
            IsRequired: true
        });
        expect(profiles.some(p => p.Codec === 'hevc' && p.Container === 'mp4')).toBe(false);
    });
});
