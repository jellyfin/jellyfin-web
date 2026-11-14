import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { isAxiosError } from 'axios';

import globalize from 'lib/globalize';
import type {
    TranscodeTestAdvice,
    TranscodeTestCheckKind,
    TranscodeTestCheckResult,
    TranscodeTestMediaInfo,
    TranscodeTestOutcome,
    TranscodeTestOutputInfo,
    TranscodeTestStressResult
} from '../api/useTranscodeTest';
import { codecName, rangeName } from './mediaNames';

/** The item types the stress test can play: any video, including home videos. */
export const STRESS_TEST_ITEM_TYPES = [ BaseItemKind.Movie, BaseItemKind.Episode, BaseItemKind.MusicVideo, BaseItemKind.Video ];

/**
 * A number in the user's language with a fixed range of decimals and no grouping, such as "23.976" or "23,976". It uses
 * the same locale that translated strings use for their number arguments.
 */
export const formatNumber = (value: number, minimumFractionDigits: number, maximumFractionDigits = minimumFractionDigits) => (
    value.toLocaleString(globalize.getCurrentLocale(), { minimumFractionDigits, maximumFractionDigits, useGrouping: false })
);

const CHECK_KIND_KEYS: Record<TranscodeTestCheckKind, string> = {
    Decode: 'TranscodingTestKindDecode',
    Encode: 'TranscodingTestKindEncode',
    Tonemap: 'TranscodingTestKindTonemap'
};

const OUTCOME_KEYS: Record<TranscodeTestOutcome, string> = {
    Passed: 'TranscodingTestOutcomePassed',
    Failed: 'TranscodingTestOutcomeFailed',
    Software: 'TranscodingTestOutcomeSoftware',
    NotSupported: 'TranscodingTestOutcomeNotSupported',
    Skipped: 'TranscodingTestOutcomeSkipped'
};

/** What a check tests, such as "Decode". */
export const checkKindLabel = (kind: TranscodeTestCheckKind) => globalize.translate(CHECK_KIND_KEYS[kind]);

/** A check's result, such as "Works". */
export const outcomeLabel = (outcome: TranscodeTestOutcome) => globalize.translate(OUTCOME_KEYS[outcome]);

export const checkName = (check: TranscodeTestCheckResult) => {
    if (check.Kind === 'Tonemap') {
        return globalize.translate('TranscodingTestHdrToSdr');
    }
    return `${codecName(check.Codec)} ${globalize.translate('TranscodingTestBitDepth', check.BitDepth)}`;
};

// Tone mapping is only checked once, so it has no H.264 reference to compare with.
const NO_HARDWARE_KEYS: Partial<Record<TranscodeTestCheckKind, string>> = {
    Decode: 'TranscodingTestDetailNoHardwareDecode',
    Encode: 'TranscodingTestDetailNoHardwareEncode'
};

const NOT_SUPPORTED_KEYS: Record<TranscodeTestCheckKind, string> = {
    Decode: 'TranscodingTestDetailNotSupportedDecode',
    Encode: 'TranscodingTestDetailNotSupportedEncode',
    Tonemap: 'TranscodingTestDetailNotSupportedTonemap'
};

/** The decoder started, so a later step such as a filter or the encoder failed. */
const failedAfterDecoding = (frames?: number) => {
    if (frames === 1) {
        return globalize.translate('TranscodingTestDetailFailedAfterFramesOne');
    }
    return frames ?
        globalize.translate('TranscodingTestDetailFailedAfterFrames', frames) :
        globalize.translate('TranscodingTestDetailFailedAfterDecoding');
};

/** What happened, in words. */
export const checkDetail = (check: TranscodeTestCheckResult) => {
    switch (check.Outcome) {
        case 'Passed':
            return globalize.translate('TranscodingTestDetailPassed');
        case 'Software':
            return globalize.translate(check.Kind === 'Tonemap' ? 'TranscodingTestDetailTonemapCpu' : 'TranscodingTestDetailFallback');
        case 'Failed': {
            if (check.FailedAfterDecoding) {
                const started = failedAfterDecoding(check.FramesDecoded);
                return check.EnabledInSettings === false ? `${started} ${globalize.translate('TranscodingTestDetailOff')}` : started;
            }
            // A format the hardware lacks fails the same way as a broken one, so don't alarm when it is already off.
            return globalize.translate(check.EnabledInSettings === false ? 'TranscodingTestDetailFailedOff' : 'TranscodingTestDetailFailed');
        }
        case 'NotSupported': {
            // Not one frame got through while H.264 works: the hardware lacks the format, and the setup is fine.
            const noHardwareKey = NO_HARDWARE_KEYS[check.Kind];
            if (check.ReferencePassed && noHardwareKey) {
                return globalize.translate(noHardwareKey, checkName(check));
            }
            return globalize.translate(NOT_SUPPORTED_KEYS[check.Kind], check.Method ?? '');
        }
        default:
            // Without an encoder, the clip exists but could not be verified, or the clip this check needs is missing.
            return check.Method ?
                globalize.translate('TranscodingTestDetailSkipped', check.Method) :
                globalize.translate('TranscodingTestDetailSkippedNoClip');
    }
};

/**
 * ffmpeg's error for a check, or an empty string. It is prefixed with "ffmpeg:" unless the detail already ends with
 * "ffmpeg failed:", so a copied row keeps a separator between the two.
 */
export const checkError = (check: TranscodeTestCheckResult) => {
    if (!check.Error) {
        return '';
    }
    const plainFailure = check.Outcome === 'Failed' && !check.FailedAfterDecoding && check.EnabledInSettings !== false;
    return plainFailure ? check.Error : globalize.translate('TranscodingTestFfmpegError', check.Error);
};

const ADVICE_KEYS: Record<Exclude<TranscodeTestAdvice, 'None'>, Record<TranscodeTestCheckKind, string>> = {
    TurnOn: {
        Decode: 'TranscodingTestAdviceTurnOnDecode',
        Encode: 'TranscodingTestAdviceTurnOnEncode',
        Tonemap: 'TranscodingTestAdviceTurnOnTonemap'
    },
    TurnOff: {
        Decode: 'TranscodingTestAdviceTurnOffDecode',
        Encode: 'TranscodingTestAdviceTurnOffEncode',
        Tonemap: 'TranscodingTestAdviceTurnOffTonemap'
    }
};

const TURN_OFF_ENCODE_KEYS: Record<string, string> = {
    hevc: 'TranscodingTestAdviceTurnOffEncodeHevc',
    h265: 'TranscodingTestAdviceTurnOffEncodeHevc',
    av1: 'TranscodingTestAdviceTurnOffEncodeAv1'
};

/** What to change, in words, or an empty string. */
export const checkAdvice = (check: TranscodeTestCheckResult) => {
    if (check.Advice === 'None') {
        return '';
    }
    // HEVC and AV1 encoding have their own "Allow encoding in ... format" checkboxes. Turning off
    // "Enable hardware encoding" for them would also stop H.264 encoding on the GPU.
    const codecKey = check.Kind === 'Encode' && check.Advice === 'TurnOff' ? TURN_OFF_ENCODE_KEYS[check.Codec.toLowerCase()] : undefined;
    // Name the format the way the "Enable hardware decoding for" checkboxes do.
    return globalize.translate(codecKey ?? ADVICE_KEYS[check.Advice][check.Kind], codecName(check.Codec));
};

export const describeInput = (input: TranscodeTestMediaInfo) => {
    const parts = [
        input.Name,
        [
            input.Width && input.Height ? `${input.Width}×${input.Height}` : '',
            codecName(input.Codec),
            input.BitDepth ? globalize.translate('TranscodingTestBitDepth', input.BitDepth) : '',
            rangeName(input.VideoRangeType)
        ].filter(Boolean).join(' '),
        input.BitrateMbps ? globalize.translate('TranscodingTestValueMbps', input.BitrateMbps) : '',
        input.Fps ? globalize.translate('TranscodingTestValueFps', input.Fps) : ''
    ];
    return parts.filter(Boolean).join(' · ');
};

export const describeOutput = (output: TranscodeTestOutputInfo) => {
    const size = output.Width && output.Height ? `${output.Width}×${output.Height} ` : '';
    let audio = '';
    if (output.AudioCodec) {
        const channels = output.AudioChannels === 2 ?
            globalize.translate('TranscodingTestStereo') :
            globalize.translate('TranscodingTestAudioChannels', output.AudioChannels ?? '');
        audio = ` + ${output.AudioCodec.toUpperCase()} ${channels}`;
    }
    return `${size}${codecName(output.Codec)} · ${globalize.translate('TranscodingTestValueMbps', output.BitrateMbps)}${audio}`;
};

const where = (onGpu: boolean) => globalize.translate(onGpu ? 'TranscodingTestGpu' : 'TranscodingTestCpu');

export const describePipeline = (output: TranscodeTestOutputInfo) => {
    let tonemap = globalize.translate('TranscodingTestNone');
    if (output.Tonemap !== 'None') {
        tonemap = where(output.Tonemap === 'Hardware');
    }
    return globalize.translate('TranscodingTestPipeline', where(output.HardwareDecoding), where(output.HardwareEncoding), tonemap);
};

/**
 * A stress test frame rate with one to three decimals, such as "23.976", "24.0" or "23.96". The server rounds readings
 * so that one under the threshold never shows as equal to it.
 */
export const formatFps = (fps: number) => formatNumber(fps, 1, 3);

/** How the running stress test adds streams and when it stops, with the server's timing. */
export const stressRunningHelp = (stress: TranscodeTestStressResult) => globalize.translate(
    'StressTestRunningHelp',
    stress.RampSeconds,
    formatFps(stress.ThresholdFps),
    `${Math.round(stress.FpsRatio * 100)}%`,
    stress.Input?.Fps ?? '',
    stress.FailSeconds,
    stress.SettleSeconds
);

/** A stress test target in the picker, such as "1080p H.264 8 Mbps". */
export const stressTargetLabel = (resolution: string, codec: string, bitrate: number) => (
    globalize.translate('StressTestTarget', resolution, codecName(codec), globalize.translate('TranscodingTestValueMbps', bitrate / 1_000_000))
);

/** The number of settings to change, after the compatibility check summary. */
export const compatibilityChanges = (count: number) => {
    if (count === 0) {
        return globalize.translate('CompatibilityCheckNoChanges');
    }
    return count === 1 ? globalize.translate('CompatibilityCheckChangesOne') : globalize.translate('CompatibilityCheckChanges', count);
};

const MAX_SERVER_MESSAGE_LENGTH = 300;

/**
 * The server's reason for refusing to start a test, as plain text, or undefined when it gave none. Only a 400 or 409
 * response is used: its body is either the controller's message or ASP.NET's validation problem details. Anything that
 * looks like markup, such as a proxy's error page, is ignored.
 */
export const startErrorMessage = (error: unknown): string | undefined => {
    if (!isAxiosError(error) || (error.response?.status !== 400 && error.response?.status !== 409)) {
        return undefined;
    }
    const data: unknown = error.response.data;
    let message: string | undefined;
    if (typeof data === 'string') {
        message = data;
    } else if (data && typeof data === 'object') {
        const problem = data as { title?: unknown, errors?: unknown };
        const errors = problem.errors && typeof problem.errors === 'object' ?
            Object.values(problem.errors).flat().filter((e): e is string => typeof e === 'string') :
            [];
        message = errors.length ? errors.join(' ') : undefined;
        if (!message && typeof problem.title === 'string') {
            message = problem.title;
        }
    }
    message = message?.trim();
    if (!message || /[<>]/.test(message)) {
        return undefined;
    }
    return message.length > MAX_SERVER_MESSAGE_LENGTH ? `${message.slice(0, MAX_SERVER_MESSAGE_LENGTH)}…` : message;
};
