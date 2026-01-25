/**
 * Observability Module Index
 * Centralized exports for wide events and logging
 */

// Core types
export type {
    WideEvent,
    RequestContextData,
    BusinessContext,
    EnvironmentContext,
    HighCardinalityFields,
    CreateEventOptions,
    JourneyContext,
    EventOutcome,
    LogLevel as WideEventLogLevel,
    WideEventLogger
} from './types';

// Environment utilities
export {
    getSessionId,
    getBuildHash,
    getAppVersion,
    getUserAgent,
    getCurrentUrl,
    getEnvironmentContext,
    getCurrentUserId,
    getCurrentServerId,
    generateEventId,
    clearEnvironmentCache,
    initializeEnvironment
} from './environment';

// Request context middleware
export { RequestContext } from './requestContext';

// Legacy logger (updated to support wide events)
export { logger, LogLevel as LegacyLogLevel, type LogContext } from '../logger';
