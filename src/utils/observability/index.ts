/**
 * Observability Module Index
 * Centralized exports for wide events and logging
 */

// Legacy logger (updated to support wide events)
export { type LogContext, LogLevel as LegacyLogLevel, logger } from '../logger';

// Environment utilities
export {
    clearEnvironmentCache,
    generateEventId,
    getAppVersion,
    getBuildHash,
    getCurrentServerId,
    getCurrentUrl,
    getCurrentUserId,
    getEnvironmentContext,
    getSessionId,
    getUserAgent,
    initializeEnvironment
} from './environment';

// Request context middleware
export { RequestContext } from './requestContext';
// Core types
export type {
    BusinessContext,
    CreateEventOptions,
    EnvironmentContext,
    EventOutcome,
    HighCardinalityFields,
    JourneyContext,
    LogLevel as WideEventLogLevel,
    RequestContextData,
    WideEvent,
    WideEventLogger
} from './types';
