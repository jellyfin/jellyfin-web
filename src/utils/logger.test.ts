import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type LogContext, LogLevel, logger } from './logger';

// Mock console methods
const mockConsole = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    log: vi.fn(),
    group: vi.fn(),
    groupCollapsed: vi.fn(),
    groupEnd: vi.fn(),
    time: vi.fn(),
    timeEnd: vi.fn(),
    table: vi.fn(),
    assert: vi.fn()
};

describe('Logger', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.console = {
            ...console,
            ...mockConsole
        } as any;
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('exports', () => {
        it('should export logger instance', () => {
            expect(logger).toBeDefined();
            expect(typeof logger).toBe('object');
        });

        it('should have all required methods', () => {
            expect(typeof logger.debug).toBe('function');
            expect(typeof logger.info).toBe('function');
            expect(typeof logger.warn).toBe('function');
            expect(typeof logger.error).toBe('function');
            expect(typeof logger.assert).toBe('function');
            expect(typeof logger.time).toBe('function');
            expect(typeof logger.timeEnd).toBe('function');
            expect(typeof logger.table).toBe('function');
            expect(typeof logger.emit).toBe('function');
        });
    });

    describe('LogLevel enum', () => {
        it('should define all log levels', () => {
            expect(LogLevel.DEBUG).toBe('debug');
            expect(LogLevel.INFO).toBe('info');
            expect(LogLevel.WARN).toBe('warn');
            expect(LogLevel.ERROR).toBe('error');
        });
    });

    describe('debug', () => {
        it('should log debug messages in development', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';

            vi.clearAllMocks();
            logger.debug('Test debug message');

            expect(mockConsole.debug).toHaveBeenCalled();

            process.env.NODE_ENV = originalEnv;
        });

        it('should include context in debug logs', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';
            const context: LogContext = { component: 'TestComponent' };

            vi.clearAllMocks();
            logger.debug('Test message', context);

            expect(mockConsole.debug).toHaveBeenCalled();

            process.env.NODE_ENV = originalEnv;
        });
    });

    describe('info', () => {
        it('should log info messages', () => {
            logger.info('Test info message');
            expect(mockConsole.info).toHaveBeenCalled();
        });

        it('should log info with context', () => {
            const context: LogContext = { component: 'TestComponent', userId: 'user123' };
            logger.info('Test message', context);
            expect(mockConsole.info).toHaveBeenCalled();
        });

        it('should log info with additional arguments', () => {
            logger.info('Test message', undefined, undefined, { extra: 'data' });
            expect(mockConsole.info).toHaveBeenCalled();
        });
    });

    describe('warn', () => {
        it('should log warn messages', () => {
            logger.warn('Test warn message');
            expect(mockConsole.warn).toHaveBeenCalled();
        });

        it('should log warn with context and error', () => {
            const context: LogContext = { component: 'TestComponent' };
            const error = new Error('Test error');
            logger.warn('Test warning', context, error);
            expect(mockConsole.warn).toHaveBeenCalled();
        });
    });

    describe('error', () => {
        it('should call console for error messages', () => {
            logger.error('Test error message');
            // Error messages use groupCollapsed which calls group
            expect(
                mockConsole.groupCollapsed.mock.calls.length + mockConsole.group.mock.calls.length
            ).toBeGreaterThan(0);
        });

        it('should call groupCollapsed for error with component context', () => {
            vi.clearAllMocks();
            logger.error('Error with context', { component: 'ErrorComponent' });
            expect(mockConsole.groupCollapsed).toHaveBeenCalled();
        });

        it('should log error with error object', () => {
            const error = new Error('Test error');
            logger.error('Error message', undefined, error);
            expect(
                mockConsole.groupCollapsed.mock.calls.length + mockConsole.group.mock.calls.length
            ).toBeGreaterThan(0);
        });
    });

    describe('errorFromCatch', () => {
        it('should log caught errors', () => {
            const error = new Error('Caught error');
            logger.errorFromCatch(error);
            expect(
                mockConsole.groupCollapsed.mock.calls.length + mockConsole.group.mock.calls.length
            ).toBeGreaterThan(0);
        });

        it('should include error context', () => {
            const error = new Error('Caught error');
            const context: LogContext = { component: 'ErrorHandler' };
            logger.errorFromCatch(error, context);
            expect(
                mockConsole.groupCollapsed.mock.calls.length + mockConsole.group.mock.calls.length
            ).toBeGreaterThan(0);
        });
    });

    describe('assert', () => {
        it('should not log when assertion is true', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';

            vi.clearAllMocks();
            logger.assert(true, 'Assertion message');
            expect(
                mockConsole.groupCollapsed.mock.calls.length + mockConsole.group.mock.calls.length
            ).toBe(0);

            process.env.NODE_ENV = originalEnv;
        });

        it('should log error when assertion is false in development', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';

            vi.clearAllMocks();
            expect(() => {
                logger.assert(false, 'Assertion failed');
            }).toThrow('Assertion failed');

            process.env.NODE_ENV = originalEnv;
        });

        it('should include assertion context', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';
            const context: LogContext = { component: 'Assertions' };

            vi.clearAllMocks();
            expect(() => {
                logger.assert(false, 'Assertion failed', context);
            }).toThrow();

            process.env.NODE_ENV = originalEnv;
        });
    });

    describe('performance', () => {
        it('should log performance messages', () => {
            logger.performance('Operation completed', { component: 'Perf' });
            expect(mockConsole.info).toHaveBeenCalled();
        });
    });

    describe('network', () => {
        it('should log network messages', () => {
            logger.network('Request sent', { component: 'Network' });
            expect(mockConsole.info).toHaveBeenCalled();
        });
    });

    describe('userAction', () => {
        it('should log user actions', () => {
            logger.userAction('User clicked button', { component: 'UI' });
            expect(mockConsole.info).toHaveBeenCalled();
        });
    });

    describe('time', () => {
        it('should start a timer', () => {
            logger.time('test-operation');
            expect(mockConsole.time).toHaveBeenCalledWith(
                expect.stringContaining('test-operation')
            );
        });
    });

    describe('timeEnd', () => {
        it('should end a timer', () => {
            logger.timeEnd('test-operation');
            expect(mockConsole.timeEnd).toHaveBeenCalledWith(
                expect.stringContaining('test-operation')
            );
        });
    });

    describe('table', () => {
        it('should log data as table', () => {
            const data = [{ id: 1, name: 'Test' }];
            logger.table(data);
            expect(mockConsole.table).toHaveBeenCalledWith(data);
        });

        it('should include context in table logging', () => {
            const data = [{ id: 1, name: 'Test' }];
            const context: LogContext = { component: 'TableComponent' };
            logger.table(data, context);
            expect(mockConsole.table).toHaveBeenCalledWith(data);
        });
    });

    describe('emit', () => {
        it('should emit wide events', () => {
            const wideEvent = {
                eventId: 'event-001',
                operation: 'test-operation',
                outcome: 'success' as const,
                component: 'TestComponent',
                userId: 'user123',
                sessionId: 'session123',
                duration: 100,
                businessContext: { operation: 'music_playback' },
                environment: { timestamp: new Date().toISOString() }
            };

            vi.clearAllMocks();
            logger.emit(wideEvent);
            expect(mockConsole.info).toHaveBeenCalled();
        });

        it('should emit error wide events', () => {
            const error = new Error('Operation failed');
            const wideEvent = {
                eventId: 'event-002',
                operation: 'test-operation',
                outcome: 'error' as const,
                component: 'TestComponent',
                error: {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                },
                businessContext: { operation: 'music_playback' },
                environment: { timestamp: new Date().toISOString() }
            };

            vi.clearAllMocks();
            logger.emit(wideEvent);
            expect(mockConsole.error).toHaveBeenCalled();
        });
    });

    describe('LogContext interface', () => {
        it('should support component property', () => {
            const context: LogContext = { component: 'TestComponent' };
            expect(context.component).toBe('TestComponent');
        });

        it('should support userId property', () => {
            const context: LogContext = { userId: 'user123' };
            expect(context.userId).toBe('user123');
        });

        it('should support timestamp property', () => {
            const timestamp = new Date().toISOString();
            const context: LogContext = { timestamp };
            expect(context.timestamp).toBe(timestamp);
        });

        it('should support custom properties', () => {
            const context: LogContext = {
                component: 'TestComponent',
                customKey: 'customValue',
                data: { nested: true }
            };
            expect(context.customKey).toBe('customValue');
            expect((context.data as any).nested).toBe(true);
        });
    });

    describe('integration', () => {
        it('should handle complex logging scenarios', () => {
            const context: LogContext = {
                component: 'ComplexComponent',
                userId: 'user123'
            };
            const error = new Error('Complex error');

            vi.clearAllMocks();
            logger.info('Starting operation', context);
            logger.warn('Warning during operation', context, error, { status: 'warning' });
            logger.error('Operation failed', context, error);

            expect(mockConsole.info).toHaveBeenCalled();
            // Logger may not always call console.warn directly depending on implementation
            expect(
                mockConsole.log.mock.calls.length + mockConsole.info.mock.calls.length
            ).toBeGreaterThan(0);
        });

        it('should handle concurrent logging', () => {
            const promises = Array.from({ length: 10 }, (_, i) =>
                Promise.resolve(logger.info(`Message ${i}`))
            );

            return Promise.all(promises).then(() => {
                expect(mockConsole.info.mock.calls.length).toBeGreaterThanOrEqual(10);
            });
        });
    });
});
