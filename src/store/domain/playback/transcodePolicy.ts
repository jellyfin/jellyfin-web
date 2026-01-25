/**
 * Transcode Policy
 *
 * Defines when transcoding is allowed based on media type and policy.
 * Audio: Never transcode (direct play only)
 * Video: Conditional transcode (fallback when direct play not supported)
 * Photo/Book: Never transcode
 */

import { RequestContext } from '../../../utils/observability';
import type { MediaType } from '../../types';

export enum TranscodeDecisionReason {
    DIRECT_PREFERRED = 'direct_preferred',
    DIRECT_NOT_SUPPORTED = 'direct_not_supported',
    DIRECT_FAILED = 'direct_failed',
    BITRATE_EXCEEDED = 'bitrate_exceeded',
    POLICY_FORBIDDEN = 'policy_forbids_transcode',
    NO_FALLBACK = 'no_fallback_available'
}

export interface TranscodeDecision {
    shouldTranscode: boolean;
    reason: TranscodeDecisionReason;
    errorMessage?: string;
    fallbackAvailable?: boolean;
}

export interface TranscodePolicyConfig {
    mediaType: MediaType;
    allowTranscode: boolean;
    preferDirectPlay: boolean;
    maxTranscodeBitrate?: number;
}

export interface StreamInfo {
    playMethod?: 'DirectPlay' | 'DirectStream' | 'Transcode';
    bitrate?: number;
    supportsDirectPlay?: boolean;
    supportedVideoTypes?: string[];
    supportedAudioTypes?: string[];
}

export interface DeviceProfile {
    maxStreamingBitrate?: number;
    maxStaticBitrate?: number;
    supportsDirectPlay?: boolean;
    supportsTranscoding?: boolean;
}

// Policy definitions for each media type
const TRANSCODE_POLICIES: Record<MediaType, TranscodePolicyConfig> = {
    Audio: {
        mediaType: 'Audio',
        allowTranscode: false,
        preferDirectPlay: true
    },
    Video: {
        mediaType: 'Video',
        allowTranscode: true,
        preferDirectPlay: true,
        maxTranscodeBitrate: 100000000 // 100 Mbps
    },
    Photo: {
        mediaType: 'Photo',
        allowTranscode: false,
        preferDirectPlay: true
    },
    Book: {
        mediaType: 'Book',
        allowTranscode: false,
        preferDirectPlay: true
    },
    Unknown: {
        mediaType: 'Unknown',
        allowTranscode: false,
        preferDirectPlay: false
    }
};

/**
 * Determine if transcoding should be used for a given media type and stream info
 */
export function shouldTranscode(
    mediaType: MediaType,
    streamInfo: StreamInfo,
    deviceProfile?: DeviceProfile
): TranscodeDecision {
    return RequestContext.withContext(
        {
            operation: 'evaluateTranscodeDecision',
            component: 'TranscodePolicy'
        },
        () => {
            const policy = TRANSCODE_POLICIES[mediaType];
            const decision = makeTranscodeDecision(mediaType, streamInfo, deviceProfile, policy);

            RequestContext.emit({
                operation: 'evaluateTranscodeDecision',
                component: 'TranscodePolicy',
                outcome: 'success',
                businessContext: {
                    mediaType,
                    currentPlayMethod: streamInfo.playMethod,
                    decisionShouldTranscode: decision.shouldTranscode,
                    decisionReason: decision.reason,
                    policyAllowTranscode: policy.allowTranscode,
                    streamBitrate: streamInfo.bitrate,
                    deviceMaxBitrate: deviceProfile?.maxStreamingBitrate,
                    supportsDirectPlay: streamInfo.supportsDirectPlay,
                    fallbackAvailable: decision.fallbackAvailable,
                    policyMaxBitrate: policy.maxTranscodeBitrate
                }
            });

            return decision;
        }
    );
}

/**
 * Internal logic for making transcode decisions (no logging)
 */
function makeTranscodeDecision(
    mediaType: MediaType,
    streamInfo: StreamInfo,
    deviceProfile: DeviceProfile | undefined,
    policy: TranscodePolicyConfig
): TranscodeDecision {
    // Audio: Never transcode
    if (mediaType === 'Audio') {
        if (streamInfo.playMethod === 'DirectPlay') {
            return {
                shouldTranscode: false,
                reason: TranscodeDecisionReason.DIRECT_PREFERRED
            };
        }

        return {
            shouldTranscode: false,
            reason: TranscodeDecisionReason.POLICY_FORBIDDEN,
            errorMessage: 'Audio transcoding is not supported. Please use a supported audio format.',
            fallbackAvailable: false
        };
    }

    // Video: Conditional transcode
    if (mediaType === 'Video') {
        // Direct play preferred and available
        if (policy.preferDirectPlay && streamInfo.playMethod === 'DirectPlay') {
            return {
                shouldTranscode: false,
                reason: TranscodeDecisionReason.DIRECT_PREFERRED
            };
        }

        if (!streamInfo.supportsDirectPlay) {
            return {
                shouldTranscode: true,
                reason: TranscodeDecisionReason.DIRECT_NOT_SUPPORTED,
                fallbackAvailable: true
            };
        }

        if (policy.maxTranscodeBitrate && streamInfo.bitrate && streamInfo.bitrate > policy.maxTranscodeBitrate) {
            return {
                shouldTranscode: false,
                reason: TranscodeDecisionReason.BITRATE_EXCEEDED,
                errorMessage: `Bitrate ${streamInfo.bitrate} exceeds maximum allowed ${policy.maxTranscodeBitrate}`,
                fallbackAvailable: true
            };
        }

        // Device profile limits
        if (
            deviceProfile?.maxStreamingBitrate &&
            streamInfo.bitrate &&
            streamInfo.bitrate > deviceProfile.maxStreamingBitrate
        ) {
            return {
                shouldTranscode: true,
                reason: TranscodeDecisionReason.BITRATE_EXCEEDED,
                fallbackAvailable: true
            };
        }

        // Default: Allow transcode for video
        return {
            shouldTranscode: true,
            reason: TranscodeDecisionReason.DIRECT_NOT_SUPPORTED,
            fallbackAvailable: true
        };
    }

    // Photo/Book: Never transcode
    return {
        shouldTranscode: false,
        reason: TranscodeDecisionReason.POLICY_FORBIDDEN,
        errorMessage: `${mediaType} transcoding is not supported.`,
        fallbackAvailable: false
    };
}

/**
 * Handle playback errors with transcode fallback logic
 */
export function handlePlaybackError(
    error: Error,
    mediaType: MediaType,
    streamInfo: StreamInfo,
    deviceProfile?: DeviceProfile
): TranscodeDecision {
    return RequestContext.withContext(
        {
            operation: 'handlePlaybackError',
            component: 'TranscodePolicy'
        },
        () => {
            const policy = TRANSCODE_POLICIES[mediaType];
            const isTranscodeError = error.message.includes('transcode') || error.message.includes('codec');

            // Audio: No fallback available
            if (mediaType === 'Audio') {
                RequestContext.emit(
                    {
                        operation: 'handlePlaybackError',
                        component: 'TranscodePolicy',
                        outcome: 'error',
                        businessContext: {
                            mediaType,
                            errorType: error.name,
                            isTranscodeError,
                            fallbackAvailable: false
                        }
                    },
                    error
                );

                return {
                    shouldTranscode: false,
                    reason: TranscodeDecisionReason.POLICY_FORBIDDEN,
                    errorMessage: error.message,
                    fallbackAvailable: false
                };
            }

            // Video: Try transcode fallback if not already transcoding
            if (isTranscodeError || !streamInfo.playMethod) {
                RequestContext.emit(
                    {
                        operation: 'handlePlaybackError',
                        component: 'TranscodePolicy',
                        outcome: 'error',
                        businessContext: {
                            mediaType,
                            errorType: error.name,
                            isTranscodeError,
                            fallbackAvailable: false
                        }
                    },
                    error
                );

                return {
                    shouldTranscode: false,
                    reason: TranscodeDecisionReason.NO_FALLBACK,
                    errorMessage: error.message,
                    fallbackAvailable: false
                };
            }

            // Direct play failed - try transcode
            RequestContext.emit({
                operation: 'handlePlaybackError',
                component: 'TranscodePolicy',
                outcome: 'success',
                businessContext: {
                    mediaType,
                    errorType: error.name,
                    isTranscodeError: false,
                    fallbackToTranscode: true
                }
            });

            return {
                shouldTranscode: true,
                reason: TranscodeDecisionReason.DIRECT_FAILED,
                fallbackAvailable: true
            };
        }
    );
}

/**
 * Get optimal direct play codecs for the current platform
 */
export function getOptimalDirectPlayCodecs(_mediaType: MediaType): string[] {
    // Basic implementation - can be expanded based on browser/platform detection
    return ['mp3', 'aac', 'flac', 'opus'];
}

/**
 * Check if a specific format is supported for direct play
 */
export function isFormatSupported(_mediaType: MediaType, _format: string): boolean {
    // Basic implementation
    return true;
}
