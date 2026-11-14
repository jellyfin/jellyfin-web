import { AxiosError, AxiosHeaders } from 'axios';
import { describe, expect, it, vi } from 'vitest';

import enUs from 'strings/en-us.json';

import type { TranscodeTestAdvice, TranscodeTestCheckKind, TranscodeTestCheckResult, TranscodeTestOutcome, TranscodeTestStressResult } from '../api/useTranscodeTest';
import {
    STRESS_TEST_ITEM_TYPES,
    checkAdvice,
    checkDetail,
    checkError,
    checkKindLabel,
    checkName,
    compatibilityChanges,
    describeInput,
    describeOutput,
    formatFps,
    formatNumber,
    outcomeLabel,
    startErrorMessage,
    stressRunningHelp,
    stressTargetLabel
} from './transcodeTest';

const strings: Record<string, string | undefined> = enUs;

const locale = vi.hoisted(() => ({ current: 'en-us' }));

// Look strings up in the real en-us.json, so a missing key fails the test.
vi.mock('lib/globalize', () => ({
    default: {
        translate: (key: string, ...args: unknown[]) => {
            const text = strings[key];
            if (text === undefined) throw new Error(`Missing string: ${key}`);
            return text.replace(/\{(\d+)\}/g, (_, i) => String(args[Number(i)] ?? ''));
        },
        getCurrentLocale: () => locale.current
    }
}));

const check = (overrides: Partial<TranscodeTestCheckResult>): TranscodeTestCheckResult => ({
    Kind: 'Encode',
    Codec: 'h264',
    BitDepth: 8,
    Hdr: false,
    Outcome: 'Passed',
    Advice: 'None',
    ...overrides
});

describe('checkAdvice', () => {
    it('says nothing when there is nothing to change', () => {
        expect(checkAdvice(check({ Advice: 'None' }))).toBe('');
    });

    it('turns off hardware encoding when H.264 encoding fails', () => {
        expect(checkAdvice(check({ Outcome: 'Failed', Advice: 'TurnOff' })))
            .toBe(`Turn off “${strings.EnableHardwareEncoding}”.`);
    });

    it.each([
        ['hevc', strings.AllowHevcEncoding],
        ['av1', strings.AllowAv1Encoding]
    ])('turns off the allow checkbox, not hardware encoding, when %s encoding fails', (codec, label) => {
        const advice = checkAdvice(check({ Codec: codec, Outcome: 'Failed', Advice: 'TurnOff' }));

        expect(advice).toBe(`Turn off “${label}”.`);
        expect(advice).not.toContain(strings.EnableHardwareEncoding);
    });

    it('only ever advises turning on the hardware encoding switch', () => {
        const advice = checkAdvice(check({ Codec: 'av1', Advice: 'TurnOn' }));

        expect(advice).toBe(`Turn on “${strings.EnableHardwareEncoding}”.`);
    });

    it('names the format for decoding', () => {
        expect(checkAdvice(check({ Kind: 'Decode', Codec: 'vp9', Outcome: 'Failed', Advice: 'TurnOff' })))
            .toBe('Turn off VP9 under “Enable hardware decoding for”.');
    });
});

describe('checkDetail', () => {
    it('names the encoder that could not create a skipped check\'s clip', () => {
        expect(checkDetail(check({ Kind: 'Decode', Outcome: 'Skipped', Method: 'libx264' })))
            .toBe('Not tested: this ffmpeg could not create a test clip with libx264.');
    });

    it('does not name an encoder when a skipped check\'s clip could not be checked or is missing', () => {
        expect(checkDetail(check({ Kind: 'Decode', Outcome: 'Skipped', Error: 'Could not verify test clip h264.mkv' })))
            .toBe(strings.TranscodingTestDetailSkippedNoClip);
        expect(checkDetail(check({ Kind: 'Encode', Outcome: 'Skipped', Method: undefined })))
            .toBe(strings.TranscodingTestDetailSkippedNoClip);
    });

    it('reports an ffmpeg failure when the setting is on', () => {
        expect(checkDetail(check({ Outcome: 'Failed', EnabledInSettings: true })))
            .toBe(strings.TranscodingTestDetailFailed);
    });

    it('stays calm about a failure when the setting is already off', () => {
        expect(checkDetail(check({ Kind: 'Decode', Codec: 'vp8', Outcome: 'Failed', EnabledInSettings: false })))
            .toBe(strings.TranscodingTestDetailFailedOff);
    });

    it('reports an ffmpeg failure when the setting is unknown', () => {
        expect(checkDetail(check({ Outcome: 'Failed' }))).toBe(strings.TranscodingTestDetailFailed);
    });

    it('leaves other outcomes alone', () => {
        expect(checkDetail(check({ Outcome: 'Passed', EnabledInSettings: false })))
            .toBe(strings.TranscodingTestDetailPassed);
    });
});

describe('checkDetail for a format the hardware lacks', () => {
    it('says the GPU can\'t decode it when not one frame decoded while H.264 decoding works', () => {
        expect(checkDetail(check({ Kind: 'Decode', Codec: 'av1', BitDepth: 10, Outcome: 'NotSupported', EnabledInSettings: true, ReferencePassed: true })))
            .toBe('This GPU can\'t decode AV1 10-bit; H.264 decoding works here, so the setup is fine.');
    });

    it('says the GPU can\'t encode it when not one frame encoded while H.264 encoding works', () => {
        expect(checkDetail(check({ Kind: 'Encode', Codec: 'av1', Outcome: 'NotSupported', ReferencePassed: true, Method: 'av1_nvenc' })))
            .toBe('This GPU can\'t encode AV1 8-bit; H.264 encoding works here, so the setup is fine.');
    });

    it('keeps the advice to turn it off', () => {
        const lacking = check({ Kind: 'Decode', Codec: 'av1', BitDepth: 10, Outcome: 'NotSupported', Advice: 'TurnOff', EnabledInSettings: true, ReferencePassed: true });
        expect(checkAdvice(lacking)).toBe(strings.TranscodingTestAdviceTurnOffDecode?.replace('{0}', 'AV1'));
    });

    it('shows the error after the detail', () => {
        expect(checkError(check({ Outcome: 'NotSupported', ReferencePassed: true, Error: 'Error while opening encoder' })))
            .toBe('ffmpeg: Error while opening encoder');
    });

    it('keeps the old text when Jellyfin has no hardware path at all', () => {
        expect(checkDetail(check({ Kind: 'Encode', Codec: 'av1', Outcome: 'NotSupported', Method: 'libsvtav1' })))
            .toBe('No hardware encoder for this format; Jellyfin uses libsvtav1 on the CPU.');
    });
});

describe('checkDetail after decoding started', () => {
    it('says the pipeline failed after the decoded frames', () => {
        expect(checkDetail(check({ Kind: 'Decode', Outcome: 'Failed', EnabledInSettings: true, FailedAfterDecoding: true, FramesDecoded: 30 })))
            .toBe('Decoding started, but the pipeline failed after 30 frames.');
    });

    it('says a later step failed when ffmpeg gave no count', () => {
        expect(checkDetail(check({ Kind: 'Decode', Outcome: 'Failed', FailedAfterDecoding: true })))
            .toBe(strings.TranscodingTestDetailFailedAfterDecoding);
    });

    it('keeps the guidance for a format that is off', () => {
        expect(checkDetail(check({ Kind: 'Decode', Outcome: 'Failed', EnabledInSettings: false, FailedAfterDecoding: true, FramesDecoded: 1 })))
            .toBe(`Decoding started, but the pipeline failed after 1 frame. ${strings.TranscodingTestDetailOff}`);
    });
});

describe('checkError', () => {
    it('is empty without an error', () => {
        expect(checkError(check({ Outcome: 'Failed' }))).toBe('');
    });

    it('follows "ffmpeg failed:" as it is', () => {
        expect(checkError(check({ Outcome: 'Failed', EnabledInSettings: true, Error: 'Conversion failed!' }))).toBe('Conversion failed!');
    });

    it('is introduced by "ffmpeg:" after any other detail', () => {
        expect(checkError(check({ Outcome: 'Failed', EnabledInSettings: false, Error: 'Conversion failed!' }))).toBe('ffmpeg: Conversion failed!');
        expect(checkError(check({ Outcome: 'Failed', FailedAfterDecoding: true, Error: 'Conversion failed!' }))).toBe('ffmpeg: Conversion failed!');
        expect(checkError(check({ Outcome: 'Skipped', Method: 'libsvtav1', Error: 'exit code 132, ended by signal 4' })))
            .toBe('ffmpeg: exit code 132, ended by signal 4');
    });
});

describe('formatNumber', () => {
    it('uses the decimal separator of the user\'s language', () => {
        locale.current = 'de';
        try {
            expect(formatNumber(8.25, 1)).toBe('8,3');
        } finally {
            locale.current = 'en-us';
        }
    });
});

describe('formatFps', () => {
    it('shows the threshold at the source precision and readings with at least one decimal', () => {
        expect(formatFps(23.976)).toBe('23.976');
        expect(formatFps(23.96)).toBe('23.96');
        expect(formatFps(24)).toBe('24.0');
        expect(formatFps(1271.8)).toBe('1271.8');
    });

    it('uses the decimal separator of the user\'s language', () => {
        locale.current = 'de';
        try {
            expect(formatFps(23.976)).toBe('23,976');
        } finally {
            locale.current = 'en-us';
        }
    });
});

const KINDS: TranscodeTestCheckKind[] = [ 'Decode', 'Encode', 'Tonemap' ];
const OUTCOMES: TranscodeTestOutcome[] = [ 'Passed', 'Failed', 'Software', 'NotSupported', 'Skipped' ];
const ADVICE: TranscodeTestAdvice[] = [ 'None', 'TurnOn', 'TurnOff' ];

describe('string keys', () => {
    it('has a label for every check kind and outcome', () => {
        expect(KINDS.map(checkKindLabel)).toEqual([ 'Decode', 'Encode', 'Tone mapping' ]);
        expect(OUTCOMES.map(outcomeLabel)).toEqual([ 'Works', 'Failed', 'On the CPU', 'Not supported', 'Not tested' ]);
    });

    it('has a detail and advice for every kind, outcome and advice', () => {
        for (const Kind of KINDS) {
            for (const Outcome of OUTCOMES) {
                for (const Advice of ADVICE) {
                    for (const Codec of [ 'h264', 'hevc', 'av1' ]) {
                        for (const ReferencePassed of [ false, true ]) {
                            const c = check({ Kind, Outcome, Advice, Codec, ReferencePassed });
                            expect(() => [ checkDetail(c), checkAdvice(c) ]).not.toThrow();
                        }
                    }
                }
            }
        }
    });

    it('names tone mapping by its conversion', () => {
        expect(checkName(check({ Kind: 'Tonemap', Codec: 'hevc', BitDepth: 10, Hdr: true }))).toBe('HDR10 → SDR');
    });
});

describe('compatibilityChanges', () => {
    it('counts the settings to change', () => {
        expect(compatibilityChanges(0)).toBe(strings.CompatibilityCheckNoChanges);
        expect(compatibilityChanges(1)).toBe('1 setting should be changed; see the advice below.');
        expect(compatibilityChanges(3)).toBe('3 settings should be changed; see the advice below.');
    });
});

describe('units', () => {
    it('describes the input and output with translated units', () => {
        expect(describeInput({ Name: 'Movie', Width: 3840, Height: 2160, Codec: 'hevc', BitDepth: 10, VideoRangeType: 'HDR10', BitrateMbps: 58.2, Fps: 23.976 }))
            .toBe('Movie · 3840×2160 HEVC 10-bit HDR10 · 58.2 Mbps · 23.976 fps');
        expect(describeOutput({ Width: 1920, Height: 1080, Codec: 'h264', BitrateMbps: 8, AudioCodec: 'aac', AudioChannels: 6, Encoder: 'h264_nvenc', HardwareDecoding: true, HardwareEncoding: true, Tonemap: 'None' }))
            .toBe('1920×1080 H.264 · 8 Mbps + AAC 6 ch');
    });

    it('names a stress test target', () => {
        expect(stressTargetLabel('1080p', 'h264', 8_000_000)).toBe('1080p H.264 8 Mbps');
        expect(stressTargetLabel('4K', 'hevc', 20_000_000)).toBe('4K HEVC 20 Mbps');
    });
});

const httpError = (status: number, data: unknown) => {
    const headers = new AxiosHeaders();
    return new AxiosError('Request failed', 'ERR_BAD_REQUEST', { headers }, undefined, { status, statusText: '', headers, config: { headers }, data });
};

describe('startErrorMessage', () => {
    it('shows the server\'s message for a refused start', () => {
        expect(startErrorMessage(httpError(409, 'A transcoding test is already running.'))).toBe('A transcoding test is already running.');
        expect(startErrorMessage(httpError(400, 'The stress test needs a video item.'))).toBe('The stress test needs a video item.');
    });

    it('shows the validation errors of a problem details response', () => {
        const problem = { title: 'One or more validation errors occurred.', status: 400, errors: { Kind: [ 'The JSON value could not be converted to TranscodeTestKind.' ] } };
        expect(startErrorMessage(httpError(400, problem))).toBe('The JSON value could not be converted to TranscodeTestKind.');
        const range = { title: 'One or more validation errors occurred.', status: 400, errors: { MaxStreams: [ 'The field MaxStreams must be between 1 and 64.' ] } };
        expect(startErrorMessage(httpError(400, range))).toBe('The field MaxStreams must be between 1 and 64.');
        expect(startErrorMessage(httpError(400, { title: 'Bad request' }))).toBe('Bad request');
    });

    it('ignores other statuses, markup and errors without a response', () => {
        expect(startErrorMessage(httpError(500, 'Internal error'))).toBeUndefined();
        expect(startErrorMessage(httpError(409, '<html><body>Conflict</body></html>'))).toBeUndefined();
        expect(startErrorMessage(httpError(400, ''))).toBeUndefined();
        expect(startErrorMessage(new Error('Network Error'))).toBeUndefined();
    });

    it('shortens a long message', () => {
        expect(startErrorMessage(httpError(400, 'x'.repeat(400)))).toBe(`${'x'.repeat(300)}…`);
    });
});

describe('stressRunningHelp', () => {
    it('says a stream is added at most every interval, once every running stream has kept up for the settle window', () => {
        const stress = {
            Phase: 'KeepingUp', RampSeconds: 12, SettleSeconds: 3, FailSeconds: 5, ThresholdFps: 23.976, FpsRatio: 1,
            Input: { Name: 'Movie', Fps: 23.976 }
        } as TranscodeTestStressResult;

        expect(stressRunningHelp(stress)).toBe(
            'Stress test is running. Each stream must keep at least 23.976 fps (100% of the movie\'s 23.976 fps). '
            + 'A stream is added at most every 12 s, once every running stream has kept up for 3 s. '
            + 'It stops when a stream falls behind for 5 s, or at the maximum number of streams configured above.'
        );
    });
});

describe('StressTestHelp', () => {
    it('states the same rule as the running help', () => {
        expect(strings.StressTestHelp).toContain('adds a stream at most every {0} seconds, once every running stream has kept up for {1} seconds');
    });
});

describe('STRESS_TEST_ITEM_TYPES', () => {
    it('includes home videos and music videos, not only movies and episodes', () => {
        expect(STRESS_TEST_ITEM_TYPES).toEqual([ 'Movie', 'Episode', 'MusicVideo', 'Video' ]);
    });

    it('has a hint for when no video is found', () => {
        expect(strings.StressTestNoMedia).toBeTruthy();
    });
});
