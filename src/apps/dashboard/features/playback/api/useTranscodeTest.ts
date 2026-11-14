import type { Api } from '@jellyfin/sdk';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';
import { queryClient } from 'utils/query/queryClient';

export const QUERY_KEY = 'TranscodeTest';

export type TranscodeTestState = 'Idle' | 'Running' | 'Completed' | 'Failed' | 'Cancelled';
export type TranscodeTestKind = 'Compatibility' | 'StressTest';
export type TranscodeTestOutcome = 'Passed' | 'Failed' | 'Software' | 'NotSupported' | 'Skipped';
export type TranscodeTestCheckKind = 'Decode' | 'Encode' | 'Tonemap';
export type TranscodeTestAdvice = 'None' | 'TurnOn' | 'TurnOff';
export type TranscodeTestStressPhase = 'Starting' | 'WarmingUp' | 'KeepingUp' | 'FallingBehind' | 'Finished';
export type TranscodeTestEndReason = 'None' | 'LimitReached' | 'MaxStreams' | 'StreamFailed' | 'StreamStalled' | 'Cancelled' | 'Error';

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

export interface TranscodeTestStreamResult {
    Id: number
    Fps?: number
    FinalFps?: number
    MedianFps?: number
    OutputMbps?: number
    Status: string
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
    ThresholdFps: number
    FpsRatio: number
    FailedStreamId?: number
    FailedStreamFps?: number
    StreamsAtEnd?: number
    TimeLimitReached?: boolean
    PeakCombinedFps: number
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

export const useTranscodeTest = () => {
    const { api } = useApi();

    return useQuery({
        queryKey: [ QUERY_KEY ],
        queryFn: async ({ signal }) => (await request<TranscodeTestStatus>(api!, 'GET', undefined, signal)).data,
        enabled: !!api,
        refetchInterval: query => (query.state.data?.State === 'Running' ? 1000 : false)
    });
};

export const useStartTranscodeTest = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: (testRequest: TranscodeTestRequest) => request<TranscodeTestStatus>(api!, 'POST', testRequest),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: [ QUERY_KEY ] });
        }
    });
};

export const useStopTranscodeTest = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: () => request<void>(api!, 'DELETE'),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: [ QUERY_KEY ] });
        }
    });
};
