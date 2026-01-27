// Enhanced unified error logging utility with improved browser console display
// Centralizes all error reporting to console with consistent formatting and rich visual features
// Now supports wide events for observability

// Import wide event types
import type { WideEvent, WideEventLogger, EventOutcome } from './observability/types';

export enum LogLevel {
    DEBUG = 'debug',
    INFO = 'info',
    WARN = 'warn',
    ERROR = 'error'
}

export interface LogContext {
    component?: string;
    userId?: string;
    timestamp?: string;
    [key: string]: unknown;
}

interface LogEntry {
    level: LogLevel;
    message: string;
    context?: LogContext;
    error?: Error;
}

// Browser console styling with CSS for better visual hierarchy
const ConsoleStyles = {
    // Main message styling with component identification
    main: {
        [LogLevel.DEBUG]: 'color: #6B7280; font-weight: 400; font-size: 12px;',
        [LogLevel.INFO]: 'color: #059669; font-weight: 500; font-size: 12px;',
        [LogLevel.WARN]: 'color: #D97706; font-weight: 500; font-size: 12px;',
        [LogLevel.ERROR]: 'color: #DC2626; font-weight: 600; font-size: 12px;'
    },
    // Prefix styling for app identification
    prefix: 'color: #4F46E5; font-weight: 700; font-size: 11px; text-transform: uppercase;',
    // Component name styling
    component:
        'color: #7C3AED; font-weight: 600; font-size: 11px; background: #F3F4F6; padding: 1px 4px; border-radius: 2px;',
    // Timestamp styling
    timestamp: 'color: #9CA3AF; font-weight: 400; font-size: 10px;'
};

class Logger implements WideEventLogger {
    private static instance: Logger;
    private readonly isDev: boolean;
    private readonly prefix = '🎵 Jellyfin'; // Added emoji for visual identification

    private constructor() {
        this.isDev = process.env.NODE_ENV !== 'production';
    }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    private formatWithCSS(
        level: LogLevel,
        message: string,
        context?: LogContext
    ): {
        cssString: string;
        args: unknown[];
    } {
        const now = new Date();
        const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;

        const parts: string[] = [];
        const styles: string[] = [];
        const args: unknown[] = [];

        // Add prefix with emoji
        parts.push('%c%s');
        styles.push(ConsoleStyles.prefix, this.prefix);

        // Add timestamp
        parts.push('%c%s');
        styles.push(ConsoleStyles.timestamp, `[${timestamp}]`);

        // Add level with color
        parts.push('%c%s');
        styles.push(ConsoleStyles.main[level], `[${level.toUpperCase()}]`);

        // Add component if available
        if (context?.component) {
            parts.push('%c%s');
            styles.push(ConsoleStyles.component, `${context.component}`);
        }

        // Add message
        parts.push('%c%s');
        styles.push(ConsoleStyles.main[level], message);

        return {
            cssString: parts.join(' '),
            args: styles
        };
    }

    private createLogData(
        level: LogLevel,
        message: string,
        context?: LogContext,
        error?: Error,
        ...additionalArgs: unknown[]
    ): Record<string, unknown> {
        const logData: Record<string, unknown> = {
            timestamp: new Date().toISOString(),
            level,
            message,
            context
        };

        if (error) {
            logData.error = {
                name: error.name,
                message: error.message,
                stack: error.stack
            };
        }

        if (additionalArgs.length > 0) {
            logData.additionalData = additionalArgs;
        }

        return logData;
    }

    private log(level: LogLevel, message: string, context?: LogContext, error?: Error, ...args: unknown[]): void {
        if (!this.isDev && level === LogLevel.DEBUG) {
            return;
        }

        const { cssString, args: cssArgs } = this.formatWithCSS(level, message, context);
        const logData = this.createLogData(level, message, context, error, ...args);

        // Use console grouping for better organization
        const shouldGroup = level === LogLevel.ERROR || (context?.component && args.length > 0);

        if (shouldGroup) {
            const groupLabel = context?.component
                ? `${this.prefix} [${level.toUpperCase()}] ${context.component}: ${message}`
                : `${this.prefix} [${level.toUpperCase()}]: ${message}`;

            if (level === LogLevel.ERROR) {
                console.groupCollapsed(`%c${groupLabel}`, 'color: #DC2626; font-weight: 600; font-size: 12px;');
            } else if (level === LogLevel.WARN) {
                console.group(`%c${groupLabel}`, ConsoleStyles.main[level]);
            } else if (level === LogLevel.INFO) {
                console.group(`%c${groupLabel}`, ConsoleStyles.main[level]);
            } else {
                console.group(`%c${groupLabel}`, ConsoleStyles.main[level]);
            }

            console.log('Context:', context || {});
            console.log('Timestamp:', new Date().toISOString());

            if (error) {
                console.error('Error Details:', error);
            }

            if (args.length > 0) {
                console.log('Additional Data:', ...args);
            }

            console.log('Full Log Entry:', logData);
            console.groupEnd();
        } else {
            // Simple logging for less complex entries
            if (level === LogLevel.DEBUG) {
                console.debug(cssString, ...cssArgs);
                if (args.length > 0) console.debug('Data:', ...args);
            } else if (level === LogLevel.INFO) {
                console.info(cssString, ...cssArgs);
                if (args.length > 0) console.info('Data:', ...args);
            } else if (level === LogLevel.WARN) {
                console.warn(cssString, ...cssArgs);
                if (args.length > 0) console.warn('Data:', ...args);
            } else if (level === LogLevel.ERROR) {
                console.error(cssString, ...cssArgs);
                if (args.length > 0) console.error('Data:', ...args);
                if (error) console.error('Error:', error);
            }
        }
    }

    public debug(message: string, context?: LogContext, error?: Error, ...args: unknown[]): void {
        this.log(LogLevel.DEBUG, message, context, error, ...args);
    }

    public info(message: string, context?: LogContext, error?: Error, ...args: unknown[]): void {
        this.log(LogLevel.INFO, message, context, error, ...args);
    }

    public warn(message: string, context?: LogContext, error?: Error, ...args: unknown[]): void {
        this.log(LogLevel.WARN, message, context, error, ...args);
    }

    public error(message: string, context?: LogContext, error?: Error, ...args: unknown[]): void {
        this.log(LogLevel.ERROR, message, context, error, ...args);
    }

    public errorFromCatch(error: Error, context?: LogContext): void {
        this.log(LogLevel.ERROR, error.message, context, error);
    }

    public assert(condition: boolean, message: string, context?: LogContext): void {
        if (!condition) {
            this.error(message, context);
            if (this.isDev) {
                // Use console.assert for better assertion handling
                console.assert(false, `🚨 Assertion Failed: ${message}`, context);
                throw new Error(message);
            }
        }
    }

    // Enhanced methods for specific scenarios
    public performance(message: string, context?: LogContext, ...args: unknown[]): void {
        this.info(`⚡ ${message}`, context, undefined, ...args);
    }

    public network(message: string, context?: LogContext, ...args: unknown[]): void {
        this.info(`🌐 ${message}`, context, undefined, ...args);
    }

    public userAction(message: string, context?: LogContext, ...args: unknown[]): void {
        this.info(`👤 ${message}`, context, undefined, ...args);
    }

    // Create timer methods
    public time(label: string): void {
        console.time(`${this.prefix} ${label}`);
    }

    public timeEnd(label: string): void {
        console.timeEnd(`${this.prefix} ${label}`);
    }

    // Table method for structured data
    public table(data: unknown[], context?: LogContext): void {
        const label = context?.component
            ? `${this.prefix} [${context.component}] Data Table`
            : `${this.prefix} Data Table`;

        console.log(`%c${label}`, 'color: #4F46E5; font-weight: 600;');
        console.table(data);
    }

    /**
     * Emit a wide event - primary method for observability
     * This is the new preferred way to log events
     */
    public emit(wideEvent: WideEvent): void {
        if (!this.isDev && wideEvent.outcome === 'success') {
            // In production, only emit errors to console, but still send to analytics
            return;
        }

        // Format wide event for console display
        const level = wideEvent.outcome === 'error' ? LogLevel.ERROR : LogLevel.INFO;
        const { cssString, args } = this.formatWideEventForConsole(wideEvent, level);

        // Log to console with appropriate styling
        if (level === LogLevel.ERROR) {
            console.error(cssString, ...args);
            if (wideEvent.error) {
                console.error('Error Details:', wideEvent.error);
            }
        } else {
            console.info(cssString, ...args);
        }

        // Send to external analytics/monitoring services
        this.sendToAnalytics(wideEvent);
    }

    /**
     * Format wide event for browser console display
     */
    private formatWideEventForConsole(wideEvent: WideEvent, level: LogLevel): { cssString: string; args: unknown[] } {
        const now = new Date();
        const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;

        const parts: string[] = [];
        const args: unknown[] = [];

        // Add prefix
        parts.push('%c%s');
        args.push(ConsoleStyles.prefix, '🎵 WIDE EVENT');

        // Add timestamp
        parts.push('%c%s');
        args.push(ConsoleStyles.timestamp, `[${timestamp}]`);

        // Add operation
        parts.push('%c%s');
        args.push(ConsoleStyles.main[level], `[${wideEvent.operation}]`);

        // Add component if available
        if (wideEvent.component) {
            parts.push('%c%s');
            args.push(ConsoleStyles.component, wideEvent.component);
        }

        // Add outcome
        parts.push('%c%s');
        const outcomeColor =
            wideEvent.outcome === 'error' ? ConsoleStyles.main[LogLevel.ERROR] : ConsoleStyles.main[LogLevel.INFO];
        args.push(
            outcomeColor,
            `${wideEvent.outcome.toUpperCase()}${wideEvent.duration ? ` (${wideEvent.duration}ms)` : ''}`
        );

        // Add user/session info if available
        if (wideEvent.userId || wideEvent.sessionId) {
            parts.push('%c%s');
            args.push(
                'color: #6B7280; font-size: 10px;',
                `${wideEvent.userId ? `user:${wideEvent.userId.slice(0, 8)}...` : ''}${wideEvent.userId && wideEvent.sessionId ? '|' : ''}${wideEvent.sessionId ? `session:${wideEvent.sessionId.slice(0, 8)}...` : ''}`
            );
        }

        return {
            cssString: parts.join(' '),
            args
        };
    }

    /**
     * Send wide event to external analytics services
     * Extend this to integrate with your monitoring tools
     */
    private sendToAnalytics(wideEvent: WideEvent): void {
        // Send to existing error monitor for errors
        if (wideEvent.outcome === 'error' && wideEvent.error) {
            try {
                const { errorMonitor } = require('./errorMonitor');
                errorMonitor.captureError(wideEvent.error.message, `WideEvent:${wideEvent.operation}`);
            } catch {
                // Silently fail if errorMonitor not available
            }
        }

        // Send to external analytics service
        // TODO: Integrate with your preferred analytics platform
        // Examples: Datadog, New Relic, Sentry, etc.

        // For development, log to console in development mode
        if (this.isDev) {
            console.groupCollapsed('📊 Wide Event Details');
            console.log('Event:', wideEvent);
            console.log('Business Context:', wideEvent.businessContext);
            console.log('Environment:', wideEvent.environment);
            if (wideEvent.error) {
                console.log('Error:', wideEvent.error);
            }
            console.groupEnd();
        }

        // Send to endpoint for server-side logging
        if (this.isDev) {
            return;
        }

        try {
            fetch('/__wide-event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(wideEvent)
            }).catch(() => {
                // Silently fail - console logging is sufficient for now
            });
        } catch {
            // Silently fail if fetch not available
        }
    }
}

export const logger = Logger.getInstance();

export default logger;
