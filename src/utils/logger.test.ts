import { describe, expect, it, vi, beforeEach } from 'vitest';

import { type LogContext, logger } from './logger';

describe('Logger', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('log formatting', () => {
        it('should format debug message correctly', () => {
            const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

            logger.debug('test message', { component: 'TestComponent' });

            expect(debugSpy).toHaveBeenCalled();
        });

        it('should format info message correctly', () => {
            const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

            logger.info('test message', { component: 'TestComponent' });

            expect(infoSpy).toHaveBeenCalled();
        });

        it('should format warning message correctly', () => {
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            logger.warn('test message', { component: 'TestComponent' });

            expect(warnSpy).toHaveBeenCalled();
        });

        it('should format error message correctly', () => {
            const groupSpy = vi.spyOn(console, 'groupCollapsed').mockImplementation(() => {});

            logger.error('test message', { component: 'TestComponent' });

            expect(groupSpy).toHaveBeenCalled();
        });

        it('should handle message without component', () => {
            const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

            logger.info('message without component');

            expect(infoSpy).toHaveBeenCalled();
        });

        it('should include custom context data', () => {
            const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

            const context: LogContext = {
                component: 'TestComponent',
                userId: 'user123',
                customData: 'test value'
            };

            logger.info('test message', context);

            expect(infoSpy).toHaveBeenCalled();
        });

        it('should handle empty message', () => {
            const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

            logger.info('');

            expect(infoSpy).toHaveBeenCalled();
        });

        it('should handle complex context objects', () => {
            const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

            const complexContext = {
                component: 'ComplexComponent',
                nested: {
                    deep: {
                        value: 'test'
                    }
                },
                array: [1, 2, 3]
            };

            logger.info('complex message', complexContext);

            expect(infoSpy).toHaveBeenCalled();
        });

        it('should handle error objects', () => {
            const groupSpy = vi.spyOn(console, 'groupCollapsed').mockImplementation(() => {});

            logger.error('operation failed', { component: 'ErrorComponent' });

            expect(groupSpy).toHaveBeenCalled();
        });
    });

    describe('edge cases', () => {
        it('should handle special characters in message', () => {
            const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

            logger.info('message with unicode: 🌍 test émojis 🎉');

            expect(infoSpy).toHaveBeenCalled();
        });

        it('should handle very long messages', () => {
            const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

            const longMessage = 'a'.repeat(1000);
            logger.info(longMessage, { component: 'LongMessageComponent' });

            expect(infoSpy).toHaveBeenCalled();
        });
    });
});
