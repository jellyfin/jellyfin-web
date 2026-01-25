import { logger } from './logger';

class ErrorMonitor {
    private static instance: ErrorMonitor | null = null;
    private errorCount = 0;
    private readonly errors: Array<{ id: number; message: string; stack?: string; timestamp: string; type: string }> =
        [];

    private constructor() {
        this.setupGlobalListeners();
    }

    static getInstance(): ErrorMonitor {
        if (ErrorMonitor.instance === null) {
            ErrorMonitor.instance = new ErrorMonitor();
        }
        return ErrorMonitor.instance;
    }

    private captureError(error: Error | string, type: string): void {
        const errorObj = error instanceof Error ? error : new Error(error);
        this.errorCount++;
        const errorInfo = {
            id: this.errorCount,
            message: errorObj.message,
            stack: errorObj.stack,
            timestamp: new Date().toISOString(),
            type
        };
        this.errors.push(errorInfo);
        if (this.errors.length > 100) this.errors.shift();

        localStorage.setItem('_jellyfin_error_monitor', JSON.stringify(this.errors));
        window.dispatchEvent(new CustomEvent('jellyfin-error', { detail: errorInfo }));

        fetch('/__error-monitor/event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(errorInfo)
        }).catch(() => {
            // Silently fail - error is already logged via logger
        });

        logger.error(`[${type}] ${errorObj.message}`, { component: 'ErrorMonitor', error: errorObj });
    }

    private setupGlobalListeners(): void {
        if (typeof window !== 'undefined') {
            window.addEventListener('error', (event: ErrorEvent) => {
                const error = event.error;
                if (error instanceof Error) {
                    this.captureError(error, 'UNCAUGHT_ERROR');
                } else {
                    this.captureError(event.message, 'UNCAUGHT_ERROR');
                }
            });

            window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
                const reason = event.reason;
                this.captureError(reason instanceof Error ? reason : String(reason), 'UNHANDLED_REJECTION');
            });
        }
    }

    getErrors(): Array<{ id: number; message: string; stack?: string; timestamp: string; type: string }> {
        const stored = localStorage.getItem('_jellyfin_error_monitor');
        if (stored != null && stored.length > 0) {
            try {
                return JSON.parse(stored);
            } catch {
                logger.warn('Failed to parse stored errors', { component: 'ErrorMonitor' });
            }
        }
        return [...this.errors];
    }

    clearErrors(): void {
        this.errors.length = 0;
        this.errorCount = 0;
        localStorage.removeItem('_jellyfin_error_monitor');
        logger.info('Error monitor cleared', { component: 'ErrorMonitor' });
    }

    getErrorCount(): number {
        return this.errorCount;
    }
}

export const errorMonitor = ErrorMonitor.getInstance();

export function getErrors() {
    return errorMonitor.getErrors();
}

export function clearErrors() {
    return errorMonitor.clearErrors();
}

export function getErrorCount() {
    return errorMonitor.getErrorCount();
}

export default {
    getErrors,
    clearErrors,
    getErrorCount
};
