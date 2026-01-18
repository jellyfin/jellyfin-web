// AudioErrorHandler.ts - Centralized error handling for audio components

import { logger, LogLevel } from 'utils/logger';

export enum AudioErrorType {
    WEB_AUDIO_NOT_SUPPORTED = 'WEB_AUDIO_NOT_SUPPORTED',
    AUDIO_CONTEXT_FAILED = 'AUDIO_CONTEXT_FAILED',
    AUDIO_NODE_CREATION_FAILED = 'AUDIO_NODE_CREATION_FAILED',
    AUDIO_WORKLET_LOAD_FAILED = 'AUDIO_WORKLET_LOAD_FAILED',
    VISUALIZER_INIT_FAILED = 'VISUALIZER_INIT_FAILED',
    CROSSFADE_FAILED = 'CROSSFADE_FAILED',
    NORMALIZATION_FAILED = 'NORMALIZATION_FAILED',
    NETWORK_ERROR = 'NETWORK_ERROR',
    MEDIA_ERROR = 'MEDIA_ERROR',
    CAPABILITY_DETECTION_FAILED = 'CAPABILITY_DETECTION_FAILED'
}

export enum AudioErrorSeverity {
    LOW = 'low', // Non-critical, fallback available
    MEDIUM = 'medium', // Affects functionality but not critical
    HIGH = 'high', // Critical functionality broken
    CRITICAL = 'critical' // System unusable
}

export interface AudioError {
    type: AudioErrorType;
    severity: AudioErrorSeverity;
    message: string;
    component: string;
    originalError?: Error;
    context?: Record<string, any>;
    recoverable: boolean;
}

export class AudioErrorHandler {
    private static instance: AudioErrorHandler;
    private errorHistory: AudioError[] = [];
    private maxHistorySize = 50;

    static getInstance(): AudioErrorHandler {
        if (!AudioErrorHandler.instance) {
            AudioErrorHandler.instance = new AudioErrorHandler();
        }
        return AudioErrorHandler.instance;
    }

    /**
     * Handle an audio error with consistent logging and recovery
     */
    handleError(error: AudioError): void {
        // Add to history
        this.errorHistory.push({
            ...error,
            context: {
                ...error.context,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent
            }
        });

        // Trim history if too large
        if (this.errorHistory.length > this.maxHistorySize) {
            this.errorHistory = this.errorHistory.slice(-this.maxHistorySize);
        }

        // Log based on severity using unified logger
        this.logError(error);

        // Attempt recovery if possible
        if (error.recoverable) {
            this.attemptRecovery(error);
        }

        // Emit error event for monitoring
        this.emitErrorEvent(error);
    }

    /**
     * Create a standardized error object
     */
    createError(
        type: AudioErrorType,
        severity: AudioErrorSeverity,
        component: string,
        message: string,
        originalError?: Error,
        context?: Record<string, any>,
        recoverable = true
    ): AudioError {
        return {
            type,
            severity,
            message,
            component,
            originalError,
            context,
            recoverable
        };
    }

    /**
     * Wrap a function with error handling
     */
    async wrapAsync<T>(
        operation: () => Promise<T>,
        errorType: AudioErrorType,
        severity: AudioErrorSeverity,
        component: string,
        context?: Record<string, any>
    ): Promise<T | null> {
        try {
            return await operation();
        } catch (error) {
            const audioError = this.createError(
                errorType,
                severity,
                component,
                error instanceof Error ? error.message : String(error),
                error instanceof Error ? error : undefined,
                context
            );
            this.handleError(audioError);
            return null;
        }
    }

    /**
     * Wrap a synchronous function with error handling
     */
    wrapSync<T>(
        operation: () => T,
        errorType: AudioErrorType,
        severity: AudioErrorSeverity,
        component: string,
        context?: Record<string, any>
    ): T | null {
        try {
            return operation();
        } catch (error) {
            const audioError = this.createError(
                errorType,
                severity,
                component,
                error instanceof Error ? error.message : String(error),
                error instanceof Error ? error : undefined,
                context
            );
            this.handleError(audioError);
            return null;
        }
    }

    /**
     * Get recent errors for debugging
     */
    getRecentErrors(count = 10): AudioError[] {
        return this.errorHistory.slice(-count);
    }

    /**
     * Check if a specific error type has occurred recently
     */
    hasRecentError(type: AudioErrorType, withinMs = 30000): boolean {
        const now = Date.now();
        return this.errorHistory.some(error =>
            error.type === type
            && now - new Date(error.context?.timestamp || 0).getTime() < withinMs
        );
    }

    private logError(error: AudioError): void {
        const message = `${error.type}: ${error.message}`;
        const context = {
            ...error.context,
            type: error.type,
            severity: error.severity,
            component: error.component,
            recoverable: error.recoverable
        };

        switch (error.severity) {
            case AudioErrorSeverity.LOW:
                logger.debug(message, context);
                break;
            case AudioErrorSeverity.MEDIUM:
                logger.warn(message, context, error.originalError);
                break;
            case AudioErrorSeverity.HIGH:
                logger.error(message, context, error.originalError);
                break;
            case AudioErrorSeverity.CRITICAL:
                logger.error(`CRITICAL: ${message}`, context, error.originalError);
                break;
        }
    }

    private attemptRecovery(error: AudioError): void {
        // Implement recovery strategies based on error type
        switch (error.type) {
            case AudioErrorType.AUDIO_WORKLET_LOAD_FAILED:
                // Retry worklet loading or fall back to native nodes
                logger.debug('[AudioErrorHandler] Attempting worklet recovery', {
                    component: 'AudioErrorHandler',
                    errorType: error.type
                });
                break;
            case AudioErrorType.VISUALIZER_INIT_FAILED:
                // Try alternative visualizer or disable visualization
                logger.debug('[AudioErrorHandler] Attempting visualizer recovery', {
                    component: 'AudioErrorHandler',
                    errorType: error.type
                });
                break;
            default:
                logger.debug('[AudioErrorHandler] No specific recovery for error type', {
                    component: 'AudioErrorHandler',
                    errorType: error.type
                });
        }
    }

    private emitErrorEvent(error: AudioError): void {
        // Emit custom event for monitoring systems
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            const event = new CustomEvent('audio-error', {
                detail: error
            });
            window.dispatchEvent(event);
        }
    }
}

// Export singleton instance
export const audioErrorHandler = AudioErrorHandler.getInstance();
export default audioErrorHandler;
