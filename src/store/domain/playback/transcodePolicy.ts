/**
 * Transcode Policy
 * 
 * Defines when transcoding is allowed based on media type and policy.
 * Audio: Never transcode (direct play only)
 * Video: Conditional transcode (fallback when direct play not supported)
 * Photo/Book: Never transcode
 */

import { logger } from 'utils/logger';
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
    const policy = TRANSCODE_POLICIES[mediaType];
    
    logger.debug('Evaluating transcode decision', {
        mediaType,
        playMethod: streamInfo.playMethod,
        policyAllowTranscode: policy.allowTranscode
    });

    // Audio: Never transcode
    if (mediaType === 'Audio') {
        logger.info('Audio playback: direct play required (transcoding forbidden by policy)', {
            mediaType
        });
        
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
            logger.info('Video playback: direct play available', {
                playMethod: streamInfo.playMethod
            });
            
            return {
                shouldTranscode: false,
                reason: TranscodeDecisionReason.DIRECT_PREFERRED
            };
        }

        // Check if direct play is supported
        if (streamInfo.supportsDirectPlay === false || streamInfo.playMethod !== 'DirectPlay') {
            if (!policy.allowTranscode) {
                return {
                    shouldTranscode: false,
                    reason: TranscodeDecisionReason.POLICY_FORBIDDEN,
                    errorMessage: 'Direct play not available and transcoding is not allowed for this media type.',
                    fallbackAvailable: false
                };
            }

            logger.warn('Video playback: direct play not supported, transcoding required', {
                supportsDirectPlay: streamInfo.supportsDirectPlay,
                playMethod: streamInfo.playMethod
            });

            return {
                shouldTranscode: true,
                reason: TranscodeDecisionReason.DIRECT_NOT_SUPPORTED
            };
        }

        // Check bitrate limits
        if (policy.maxTranscodeBitrate && streamInfo.bitrate && streamInfo.bitrate > policy.maxTranscodeBitrate) {
            logger.error('Video playback: bitrate exceeds limit', {
                actual: streamInfo.bitrate,
                limit: policy.maxTranscodeBitrate
            });

            return {
                shouldTranscode: false,
                reason: TranscodeDecisionReason.BITRATE_EXCEEDED,
                errorMessage: `Bitrate (${Math.round(streamInfo.bitrate / 1000000)} Mbps) exceeds maximum (${policy.maxTranscodeBitrate / 1000000} Mbps).`,
                fallbackAvailable: false
            };
        }

        // Check device profile
        if (deviceProfile) {
            if (deviceProfile.maxStreamingBitrate && streamInfo.bitrate && streamInfo.bitrate > deviceProfile.maxStreamingBitrate) {
                logger.warn('Video playback: exceeds device streaming limit', {
                    actual: streamInfo.bitrate,
                    deviceLimit: deviceProfile.maxStreamingBitrate
                });

                return {
                    shouldTranscode: true,
                    reason: TranscodeDecisionReason.BITRATE_EXCEEDED
                };
            }
        }

        // Default: Allow transcode for video
        logger.info('Video playback: transcoding allowed', {
            mediaType,
            bitrate: streamInfo.bitrate
        });

        return {
            shouldTranscode: true,
            reason: TranscodeDecisionReason.DIRECT_PREFERRED
        };
    }

    // Photo/Book: Never transcode
    logger.info(`${mediaType} playback: direct play required`, { mediaType });

    return {
        shouldTranscode: false,
        reason: TranscodeDecisionReason.POLICY_FORBIDDEN,
        errorMessage: `${mediaType} transcoding is not supported.`,
        fallbackAvailable: false
    };
}

/**
 * Handle playback failure with appropriate recovery
 */
export async function handlePlaybackFailure(
    error: Error,
    mediaType: MediaType,
    item: { id: string; name: string }
): Promise<{
    success: boolean;
    error?: string;
    canRetry: boolean;
    fallbackAvailable: boolean;
}> {
    logger.error('Playback failed', {
        error: error.message,
        mediaType,
        itemId: item.id,
        itemName: item.name
    });

    // Audio failure: Show error, don't attempt transcode
    if (mediaType === 'Audio') {
        logger.error('Audio playback failed - transcoding not allowed', {
            error: error.message
        });

        return {
            success: false,
            error: `Unable to play audio: ${error.message}`,
            canRetry: true,
            fallbackAvailable: false
        };
    }

    // Video failure: Can attempt transcode or alternative
    if (mediaType === 'Video') {
        // Check if this was a transcode failure
        const isTranscodeError = error.message.includes('transcode') || error.message.includes('encode');

        if (isTranscodeError) {
            logger.error('Transcode failed - no further fallbacks available', {
                error: error.message
            });

            return {
                success: false,
                error: `Transcoding failed: ${error.message}`,
                canRetry: false,
                fallbackAvailable: false
            };
        }

        // Direct play failed - try transcode
        logger.info('Video direct play failed - attempting transcode fallback', {
            error: error.message
        });

        return {
            success: false,
            error: `Direct play failed: ${error.message}`,
            canRetry: true,
            fallbackAvailable: true
        };
    }

    return {
        success: false,
        error: error.message,
        canRetry: true,
        fallbackAvailable: false
    };
}

/**
 * Get optimal codec for direct play based on browser support
 */
export function getOptimalDirectPlayCodecs(supportedFormats: string[]): string[] {
    // Browser native audio codec support
    const browserAudioSupport = typeof AudioContext !== 'undefined';

    if (!browserAudioSupport) {
        return supportedFormats;
    }

    // Prioritize: AAC > MP3 > Opus > FLAC
    const preferredCodecs = ['aac', 'mp3', 'opus', 'flac', 'wav'];

    return preferredCodecs.filter(codec => supportedFormats.includes(codec));
}

/**
 * Check if a media format is supported by the browser
 */
export function isFormatSupported(format: string): boolean {
    // Check for common audio formats
    const audioFormats = ['mp3', 'aac', 'ogg', 'opus', 'flac', 'wav', 'm4a'];
    const videoFormats = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'];

    const lowerFormat = format.toLowerCase();
    
    // Check audio formats
    if (audioFormats.some(f => lowerFormat.includes(f))) {
        const audioElement = new Audio();
        return audioElement.canPlayType(`audio/${format}`) !== '';
    }

    // Check video formats
    if (videoFormats.some(f => lowerFormat.includes(f))) {
        const videoElement = document.createElement('video');
        return videoElement.canPlayType(`video/${format}`) !== '';
    }

    return false;
}
