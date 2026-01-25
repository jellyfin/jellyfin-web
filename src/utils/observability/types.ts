/**
 * Wide Event Types for Observability
 * Based on logging best practices - single context-rich event per user action
 */

export type EventOutcome = 'success' | 'error';
export type LogLevel = 'info' | 'error'; // Simplified per best practices

/**
 * High-cardinality fields for powerful querying
 */
export interface HighCardinalityFields {
    userId?: string;
    sessionId?: string;
    itemId?: string;
    serverId?: string;
    requestId?: string;
    eventId?: string;
}

/**
 * Business context for answering unknown future questions
 */
export interface BusinessContext {
    [key: string]: unknown;
}

/**
 * Environment characteristics for deployment correlation
 */
export interface EnvironmentContext {
    buildHash?: string;
    version?: string;
    userAgent?: string;
    url?: string;
    timestamp: string;
    region?: string;
}

/**
 * Core wide event structure
 */
export interface WideEvent {
    // Core fields
    operation: string;
    component?: string;
    outcome: EventOutcome;
    duration?: number;

    // High cardinality fields
    userId?: string;
    sessionId?: string;
    itemId?: string;
    serverId?: string;
    requestId?: string;
    eventId: string;

    // Context
    businessContext?: BusinessContext;
    environment: EnvironmentContext;

    // Error details (only if error)
    error?: {
        name: string;
        message: string;
        stack?: string;
        type?: string;
    };
}

/**
 * Request context data for propagation across components
 */
export interface RequestContextData {
    userId?: string;
    sessionId?: string;
    itemId?: string;
    serverId?: string;
    operation?: string;
    component?: string;
    requestId?: string;
    parentEventId?: string;
    businessContext?: BusinessContext;
    journeyId?: string;
    journeyName?: string;
    totalSteps?: number;
}

/**
 * Logger interface supporting wide events
 */
export interface WideEventLogger {
    /**
     * Emit a wide event - primary logging method
     */
    emit(event: Partial<WideEvent>, error?: Error): void;

    /**
     * Legacy compatibility methods (deprecated)
     * @deprecated Use emit() instead
     */
    info(message: string, context?: Record<string, unknown>, error?: Error, ...args: unknown[]): void;
    warn(message: string, context?: Record<string, unknown>, error?: Error, ...args: unknown[]): void;
    error(message: string, context?: Record<string, unknown>, error?: Error, ...args: unknown[]): void;
    debug(message: string, context?: Record<string, unknown>, error?: Error, ...args: unknown[]): void;
}

/**
 * Event creation options
 */
export interface CreateEventOptions {
    operation: string;
    component?: string;
    outcome: EventOutcome;
    businessContext?: BusinessContext;
    duration?: number;
}

/**
 * Context for tracking user journeys
 */
export interface JourneyContext {
    journeyId: string;
    stepName: string;
    stepNumber: number;
    totalSteps?: number;
}
