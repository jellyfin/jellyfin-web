// Unified error logging utility
// Centralizes all error reporting to console with consistent formatting

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
    [key: string]: any;
}

interface LogEntry {
    level: LogLevel;
    message: string;
    context?: LogContext;
    error?: Error;
}

class Logger {
    private static instance: Logger;
    private isDev: boolean;
    private prefix = '[Jellyfin]';

    private constructor() {
        this.isDev = process.env.NODE_ENV !== 'production';
    }

    static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
        const timestamp = new Date().toISOString();
        const component = context?.component ? `[${context.component}]` : '';
        return `${this.prefix} ${timestamp} [${level.toUpperCase()}] ${component} ${message}`;
    }

    private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
        if (!this.isDev && level === LogLevel.DEBUG) {
            return;
        }

        const formattedMessage = this.formatMessage(level, message, context);
        const logData = {
            timestamp: new Date().toISOString(),
            level,
            message,
            context,
            error: error ? {
                name: error.name,
                message: error.message,
                stack: error.stack
            } : undefined
        };

        switch (level) {
            case LogLevel.DEBUG:
                console.debug(formattedMessage, logData);
                break;
            case LogLevel.INFO:
                console.info(formattedMessage, logData);
                break;
            case LogLevel.WARN:
                console.warn(formattedMessage, logData);
                break;
            case LogLevel.ERROR:
                console.error(formattedMessage, logData);
                break;
        }
    }

    debug(message: string, context?: LogContext): void {
        this.log(LogLevel.DEBUG, message, context);
    }

    info(message: string, context?: LogContext): void {
        this.log(LogLevel.INFO, message, context);
    }

    warn(message: string, context?: LogContext, error?: Error): void {
        this.log(LogLevel.WARN, message, context, error);
    }

    error(message: string, context?: LogContext, error?: Error): void {
        this.log(LogLevel.ERROR, message, context, error);
    }

    errorFromCatch(error: Error, context?: LogContext): void {
        this.log(LogLevel.ERROR, error.message, context, error);
    }

    assert(condition: boolean, message: string, context?: LogContext): void {
        if (!condition) {
            this.error(message, context);
            if (this.isDev) {
                throw new Error(message);
            }
        }
    }
}

export const logger = Logger.getInstance();

export default logger;
