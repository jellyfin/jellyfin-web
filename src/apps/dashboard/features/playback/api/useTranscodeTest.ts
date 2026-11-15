import type { Api } from '@jellyfin/sdk';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useApi } from 'hooks/useApi';
import { isTranscodeTestAccessError } from '../utils/transcodeTest';

export const QUERY_KEY = 'TranscodeTest';

export type TranscodeTestState = 'Idle' | 'Running' | 'Completed' | 'Failed' | 'Cancelled';
export type TranscodeTestKind = 'Compatibility' | 'StressTest';
export type TranscodeTestOutcome = 'Passed' | 'Failed' | 'Software' | 'NotSupported' | 'Skipped';
export type TranscodeTestCheckKind = 'Decode' | 'Encode' | 'Tonemap';
export type TranscodeTestAdvice = 'None' | 'TurnOn' | 'TurnOff';
export type TranscodeTestStressPhase = 'Starting' | 'WarmingUp' | 'KeepingUp' | 'FallingBehind' | 'Finished';
export type TranscodeTestEndReason = 'None' | 'LimitReached' | 'MaxStreams' | 'StreamFailed' | 'StreamStalled' | 'Cancelled' | 'Error' | 'GpuMemoryFull' | 'NvencSessionRefused';

/** Why a stress test ended, as the Jellyfin hardware survey names it. */
export type TranscodeTestSurveyFailureReason = 'Performance' | 'FailedTimeout' | 'FailedNvencLimit';

export interface TranscodeTestRequest {
    Kind: TranscodeTestKind
    ItemId?: string
    MediaSourceId?: string | null
    VideoCodec?: string
    MaxWidth?: number
    VideoBitrate?: number
    MaxStreams?: number
}

export interface TranscodeTestCheckResult {
    Kind: TranscodeTestCheckKind
    Codec: string
    BitDepth: number
    Hdr: boolean
    EnabledInSettings?: boolean
    Outcome: TranscodeTestOutcome
    Advice: TranscodeTestAdvice
    Method?: string
    Fps?: number
    Error?: string
    FramesDecoded?: number
    FailedAfterDecoding?: boolean
    ReferencePassed?: boolean
}

/** A stream's status; NotStarted when it ended without producing a frame. */
export type TranscodeTestStreamStatus = 'Running' | 'Stopped' | 'Failed' | 'NotStarted';

export interface TranscodeTestStreamResult {
    Id: number
    Fps?: number
    FinalFps?: number
    MedianFps?: number
    OutputMbps?: number
    Status: TranscodeTestStreamStatus
}

export interface TranscodeTestMediaInfo {
    Name: string
    Width?: number
    Height?: number
    Codec?: string
    BitDepth?: number
    VideoRangeType?: string
    BitrateMbps?: number
    Fps?: number
}

export interface TranscodeTestOutputInfo {
    Width?: number
    Height?: number
    Codec: string
    BitrateMbps: number
    AudioCodec?: string
    AudioChannels?: number
    Encoder: string
    HardwareDecoding: boolean
    HardwareEncoding: boolean
    Tonemap: 'None' | 'Hardware' | 'Software'
}

export interface TranscodeTestStressResult {
    Phase: TranscodeTestStressPhase
    EndReason: TranscodeTestEndReason
    RunningStreams: number
    MaxStableStreams: number
    PeakStreams: number
    MaxStreams: number
    NextStreamInSeconds?: number
    BehindStreamId?: number
    EndsInSeconds?: number
    RampSeconds: number
    SettleSeconds: number
    FailSeconds: number
    StartTimeoutSeconds: number
    ThresholdFps: number
    FpsRatio: number
    SourceFps: number
    SingleStreamFps?: number
    SingleStreamSpeed?: number
    SurveyFailureReason?: TranscodeTestSurveyFailureReason | null
    CouldNotStartStream?: boolean
    WaitingOnInput?: boolean
    FailedStreamId?: number
    FailedStreamFps?: number
    StreamsAtEnd?: number
    TimeLimitReached?: boolean
    PeakCombinedFps: number
    Collapsed?: boolean
    AverageOutputMbps?: number
    Error?: string
    Input?: TranscodeTestMediaInfo
    Output?: TranscodeTestOutputInfo
    ShortSource?: boolean
    RemoteSource?: boolean
    Streams: TranscodeTestStreamResult[]
}

export interface TranscodeTestStatus {
    State: TranscodeTestState
    Kind: TranscodeTestKind
    Request?: TranscodeTestRequest
    StartedAt?: string
    EndedAt?: string
    Log: { Seconds: number, Message: string }[]
    Checks: TranscodeTestCheckResult[]
    Stress?: TranscodeTestStressResult
}

// This is the only place that calls the transcoding test endpoints. The TypeScript SDK has no client for them yet.
// TODO: once the server's TranscodeTestController is released and the SDK regenerated, replace request() with
// getTranscodeTestApi(api).startTest / getTestStatus / stopTest from @jellyfin/sdk/lib/utils/api/transcode-test-api, and
// replace the types above with the generated TranscodeTestStatusDto and TranscodeTestRequestDto models.
const request = <T>(api: Api, method: 'GET' | 'POST' | 'DELETE', data?: TranscodeTestRequest, signal?: AbortSignal) => (
    api.axiosInstance.request<T>({
        url: `${api.basePath}/Transcoding/Test`,
        method,
        data,
        signal,
        headers: { Authorization: api.authorizationHeader }
    })
);

export const useTranscodeTest = (awaitingStop = false) => {
    const { api } = useApi();
    const [ requestError, setRequestError ] = useState<unknown>();

    const result = useQuery({
        queryKey: [ QUERY_KEY ],
        queryFn: async ({ signal }) => {
            try {
                const response = await request<TranscodeTestStatus>(api!, 'GET', undefined, signal);
                setRequestError(undefined);
                return response.data;
            } catch (error) {
                // Other failures show once React Query has given up retrying, as result.error.
                if (!signal.aborted && isTranscodeTestAccessError(error)) setRequestError(error);
                throw error;
            }
        },
        enabled: !!api,
        refetchInterval: query => (awaitingStop || query.state.data?.State === 'Running' ? 1000 : false)
    });

    // The application's global QueryCache clears 401 failures to null, which also resets the query's error.
    // Retain an access failure until a successful GET so that lost access cannot look like an idle test.
    return { ...result, error: requestError ?? result.error, isError: !!requestError || result.isError };
};

export const useStartTranscodeTest = () => {
    const { api } = useApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (testRequest: TranscodeTestRequest) => request<TranscodeTestStatus>(api!, 'POST', testRequest),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [ QUERY_KEY ] })
    });
};

export const useStopTranscodeTest = () => {
    const { api } = useApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => request<void>(api!, 'DELETE'),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [ QUERY_KEY ] })
    });
};
