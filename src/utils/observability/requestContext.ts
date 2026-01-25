import { AsyncLocalStorage } from 'async_hooks';
import { RequestContextData, WideEvent, CreateEventOptions, JourneyContext } from './types';
import { generateEventId, getEnvironmentContext, getCurrentUserId, getCurrentServerId } from './environment';

/**
 * RequestContext middleware for automatic context propagation
 * Enables wide events with zero manual context threading
 */

// AsyncLocalStorage for context preservation across async boundaries
const contextStore = new AsyncLocalStorage<RequestContextData>();

/**
 * Global request context state
 */
class RequestContextManager {
    /**
     * Execute function with given context
     * Context automatically propagates to all async operations within
     */
    static withContext<T>(context: Partial<RequestContextData>, fn: () => T): T {
        const currentContext = contextStore.getStore() || {};
        const mergedContext = { ...currentContext, ...context };

        return contextStore.run(mergedContext, fn);
    }

    /**
     * Get current context data
     */
    static getCurrentContext(): RequestContextData {
        return contextStore.getStore() || {};
    }

    /**
     * Create a wide event with current context merged in
     */
    static createWideEvent(options: CreateEventOptions, error?: Error): WideEvent {
        const currentContext = this.getCurrentContext();
        const environment = getEnvironmentContext();

        const event: WideEvent = {
            // Core fields
            operation: options.operation,
            component: options.component || currentContext.component,
            outcome: options.outcome,
            duration: options.duration,

            // High cardinality fields
            userId: currentContext.userId || getCurrentUserId(),
            sessionId: currentContext.sessionId,
            itemId: currentContext.itemId,
            serverId: currentContext.serverId || getCurrentServerId(),
            requestId: currentContext.requestId,
            eventId: generateEventId(),

            // Context
            businessContext: {
                ...currentContext.businessContext,
                ...options.businessContext
            },
            environment
        };

        // Add error details if provided
        if (error) {
            event.error = {
                name: error.name,
                message: error.message,
                stack: error.stack,
                type: error.constructor.name
            };
        }

        return event;
    }

    /**
     * Emit a wide event with current context
     */
    static async emit(partialEvent: Partial<WideEvent>, error?: Error): Promise<void> {
        const currentContext = this.getCurrentContext();
        const event = this.createWideEvent(
            {
                operation: partialEvent.operation || currentContext.operation || 'unknown',
                component: partialEvent.component || currentContext.component,
                outcome: partialEvent.outcome || 'success',
                businessContext: partialEvent.businessContext || currentContext.businessContext,
                duration: partialEvent.duration
            },
            error
        );

        // Import logger dynamically to avoid circular dependencies
        const { logger } = await import('../logger');
        logger.emit(event);
    }

    /**
     * Start a new user journey for tracking multi-step processes
     */
    static startJourney(journeyName: string, totalSteps?: number): string {
        const journeyId = generateEventId();

        this.withContext(
            {
                journeyId,
                journeyName,
                totalSteps
            },
            async () => {
                await this.emit({
                    operation: 'journeyStarted',
                    businessContext: {
                        journeyName,
                        totalSteps,
                        stepNumber: 0
                    }
                });
            }
        );

        return journeyId;
    }

    /**
     * Track a step in a journey
     */
    static trackJourneyStep(stepName: string, stepNumber: number, totalSteps?: number): void {
        const currentContext = this.getCurrentContext();

        if (!currentContext.journeyId) {
            console.warn('trackJourneyStep called outside of journey context');
            return;
        }

        this.emit({
            operation: 'journeyStep',
            businessContext: {
                journeyName: currentContext.journeyName,
                stepName,
                stepNumber,
                totalSteps: totalSteps || currentContext.totalSteps
            }
        });
    }

    /**
     * Complete a journey
     */
    static completeJourney(outcome: 'success' | 'error' = 'success', error?: Error): void {
        const currentContext = this.getCurrentContext();

        if (!currentContext.journeyId) {
            console.warn('completeJourney called outside of journey context');
            return;
        }

        this.emit(
            {
                operation: 'journeyCompleted',
                outcome,
                businessContext: {
                    journeyName: currentContext.journeyName,
                    totalSteps: currentContext.totalSteps
                }
            },
            error
        );
    }

    /**
     * Update current context (useful for adding context mid-operation)
     */
    static updateContext(updates: Partial<RequestContextData>): void {
        const currentContext = this.getCurrentContext();
        Object.assign(currentContext, updates);
    }

    /**
     * Get current user ID from context or store
     */
    static getCurrentUserId(): string | undefined {
        const currentContext = this.getCurrentContext();
        return currentContext.userId || getCurrentUserId();
    }

    /**
     * Get current session ID
     */
    static getSessionId(): string | undefined {
        const currentContext = this.getCurrentContext();
        return currentContext.sessionId;
    }

    /**
     * Performance measurement utility for sync functions
     */
    static measureTime<T>(operation: string, fn: () => T, options?: Partial<CreateEventOptions>): T {
        const startTime = Date.now();

        try {
            const result = fn();
            this.emit({
                operation,
                outcome: 'success',
                duration: Date.now() - startTime,
                ...options
            });
            return result;
        } catch (error) {
            this.emit(
                {
                    operation,
                    outcome: 'error',
                    duration: Date.now() - startTime,
                    ...options
                },
                error as Error
            );
            throw error;
        }
    }

    /**
     * Performance measurement utility for async functions
     */
    static async measureTimeAsync<T>(
        operation: string,
        fn: () => Promise<T>,
        options?: Partial<CreateEventOptions>
    ): Promise<T> {
        const startTime = Date.now();

        try {
            const result = await fn();
            await this.emit({
                operation,
                outcome: 'success',
                duration: Date.now() - startTime,
                ...options
            });
            return result;
        } catch (error) {
            await this.emit(
                {
                    operation,
                    outcome: 'error',
                    duration: Date.now() - startTime,
                    ...options
                },
                error as Error
            );
            throw error;
        }
    }
}

// Export as RequestContext for easier usage
export const RequestContext = RequestContextManager;

// Re-export types for convenience
export type { RequestContextData, WideEvent, CreateEventOptions, JourneyContext };
