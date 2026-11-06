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
    TranscodeTestStreamResult,
    TranscodeTestStressPhase,
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

/**
 * A frame rate as a multiple of real time, such as "1.25×", or a dash when it can't be worked out. A reading under the
 * threshold is rounded down, so a stream that fell behind never shows as "1.00×".
 */
export const formatSpeed = (fps: number | null | undefined, sourceFps: number | null | undefined, thresholdFps?: number) => {
    if (fps == null || !sourceFps) {
        return '—';
    }
    const speed = fps / sourceFps;
    return `${formatNumber(thresholdFps != null && fps < thresholdFps ? Math.floor((speed * 100) + 1e-6) / 100 : speed, 2)}×`;
};

/** A stream's frame rate for the table, "Did not start" for a stream that ended without a frame, or a dash. */
export const streamFps = (stream: TranscodeTestStreamResult, fps: number | null | undefined) => {
    if (fps != null) {
        return formatFps(fps);
    }
    return stream.Status === 'NotStarted' ? globalize.translate('StressTestStreamNotStarted') : '—';
};

/** How fast one stream ran alone, in words, or an empty string before it is known. */
export const singleStreamSpeed = (stress: TranscodeTestStressResult) => {
    if (stress.SingleStreamFps == null || !stress.SourceFps) {
        return '';
    }
    return globalize.translate('StressTestSingleStream', formatNumber(stress.SingleStreamFps, 1), formatSpeed(stress.SingleStreamFps, stress.SourceFps, stress.ThresholdFps));
};

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

export const streamCount = (count: number) => (
    count === 1 ? globalize.translate('StressTestStreamCountOne') : globalize.translate('StressTestStreamCount', count)
);

/**
 * The result of a stress test that ended because a stream fell behind, with how many streams were running then, or
 * because it ran into its time limit while streams kept dipping below real time.
 */
export const limitSummary = (stress: TranscodeTestStressResult) => {
    if (stress.TimeLimitReached) {
        // No stream fell behind for good, so there is no failed stream to name.
        return globalize.translate('StressTestFinishedTimeLimit', streamCount(stress.MaxStableStreams));
    }
    if (stress.FailedStreamId == null) {
        // Ended without a stream falling behind, for example because a short file restarted too often.
        return globalize.translate('StressTestFinishedKeptUp', streamCount(stress.MaxStableStreams));
    }
    return globalize.translate(
        'StressTestFinishedLimit',
        streamCount(stress.MaxStableStreams),
        // An older server does not send StreamsAtEnd; the most streams that ran is the same count for this ending.
        streamCount(stress.StreamsAtEnd || stress.PeakStreams),
        stress.FailedStreamId ?? '',
        stress.FailedStreamFps != null ? formatFps(stress.FailedStreamFps) : ''
    );
};

/**
 * When the streams at the limit all slowed down sharply at once rather than one falling a little behind, a hint that
 * the GPU's memory or driver, not its speed, is the likely cause.
 */
export const collapseHint = (stress: TranscodeTestStressResult) => (
    stress.EndReason === 'LimitReached' && stress.Collapsed ?
        globalize.translate('StressTestCollapsed', streamCount(stress.MaxStableStreams)) :
        undefined
);

/** The stress test's status chip: the phase while it runs, then how it ended. */
export type StressStatusKey = Exclude<TranscodeTestStressPhase, 'Finished'>
    | 'LimitReached' | 'MaxStreams' | 'NvencSessionRefused' | 'GpuMemoryFull' | 'CouldNotStart' | 'Cancelled' | 'Error';

const STRESS_STATUS_KEYS: Record<StressStatusKey, string> = {
    Starting: 'StressTestStatusStarting',
    WarmingUp: 'StressTestStatusWarmingUp',
    KeepingUp: 'StressTestStatusKeepingUp',
    FallingBehind: 'StressTestStatusFallingBehind',
    LimitReached: 'StressTestStatusLimitReached',
    MaxStreams: 'StressTestStatusMaxStreams',
    NvencSessionRefused: 'StressTestStatusNvencSessionRefused',
    GpuMemoryFull: 'StressTestStatusGpuMemoryFull',
    CouldNotStart: 'StressTestStatusCouldNotStart',
    Cancelled: 'StressTestStatusCancelled',
    Error: 'StressTestStatusError'
};

/** The text of the stress test's status chip. */
export const stressStatusLabel = (key: StressStatusKey) => globalize.translate(STRESS_STATUS_KEYS[key]);

export const stressStatusKey = (stress: TranscodeTestStressResult): StressStatusKey => {
    if (stress.Phase !== 'Finished') {
        return stress.Phase;
    }
    switch (stress.EndReason) {
        case 'LimitReached':
        case 'MaxStreams':
        case 'NvencSessionRefused':
        case 'Cancelled':
            return stress.EndReason;
        case 'GpuMemoryFull':
            return 'GpuMemoryFull';
        case 'StreamFailed':
        case 'StreamStalled':
            return stress.CouldNotStartStream ? 'CouldNotStart' : 'Error';
        default:
            return 'Error';
    }
};

/**
 * The result of a stress test that ended because a stream produced no frames, or because the newest stream never
 * started. When streams had kept up and the newest one never started, by stalling or by exiting before its first
 * frame, the kept-up count is the result, shown as a warning; otherwise it is an error. A stalled stream did start, so
 * it is said to have produced no frames rather than that the server could not start it.
 */
export const stallBanner = (stress: TranscodeTestStressResult): { severity: 'warning' | 'error', message: string } => {
    const parts: string[] = [];
    let severity: 'warning' | 'error' = 'error';
    if (stress.CouldNotStartStream) {
        severity = 'warning';
        parts.push(stress.EndReason === 'StreamStalled' ?
            globalize.translate('StressTestStartedNoFrames', streamCount(stress.MaxStableStreams), stress.FailedStreamId ?? '', stress.StartTimeoutSeconds) :
            globalize.translate('StressTestCouldNotStart', streamCount(stress.MaxStableStreams), stress.FailedStreamId ?? ''));
    } else {
        parts.push(globalize.translate('StressTestStalled', stress.FailedStreamId ?? ''));
    }
    // Only ffmpeg's error lines are shown as the cause; its other output stays in the log.
    parts.push(stress.Error ?
        globalize.translate('StressTestFfmpegError', stress.Error) :
        globalize.translate('StressTestFfmpegNoError'));
    // ffmpeg never opened the file and barely used the CPU: point at the storage rather than the GPU.
    if (stress.WaitingOnInput) {
        parts.push(globalize.translate('StressTestWaitingOnInput'));
    }
    return { severity, message: parts.join(' ') };
};

/**
 * The result of a stress test that ended because the GPU ran out of memory after streams kept up: the kept-up count
 * is the result, shown as a warning, with ffmpeg's memory error.
 */
export const gpuMemoryBanner = (stress: TranscodeTestStressResult): { severity: 'warning', message: string } => {
    const parts = [ globalize.translate('StressTestFinishedGpuMemory', streamCount(stress.MaxStableStreams), stress.FailedStreamId ?? '') ];
    if (stress.Error) {
        parts.push(globalize.translate('StressTestFfmpegError', stress.Error));
    }
    return { severity: 'warning', message: parts.join(' ') };
};

/**
 * An NVENC session refusal alone does not identify its cause, and the running-stream count does not prove a session
 * cap. Show the kept-up count and ffmpeg's diagnostic; for code 21, a hedged hint at the usual cause.
 */
export const nvencRefusedBanner = (stress: TranscodeTestStressResult): { severity: 'warning', message: string } => {
    const parts = [ globalize.translate('StressTestFinishedNvencRefused', streamCount(stress.MaxStableStreams), stress.FailedStreamId ?? '') ];
    if (stress.Error?.includes('(21)')) {
        parts.push(globalize.translate('StressTestNvencCode21'));
    }
    if (stress.Error) {
        parts.push(globalize.translate('StressTestFfmpegError', stress.Error));
    }
    return { severity: 'warning', message: parts.join(' ') };
};
