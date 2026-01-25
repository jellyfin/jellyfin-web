import { describe, expect, it, vi, beforeEach } from 'vitest';

import { LogLevel, type LogContext, logger } from './logger';

describe('Logger', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('log formatting', () => {
        it('should format debug message correctly', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            logger.debug('test message', { component: 'TestComponent' });

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('🎵 Jellyfin'),
                expect.stringContaining('test message'),
                expect.stringContaining('[DEBUG]')
            );
        });

        it('should format info message correctly', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            logger.info('test message', { component: 'TestComponent' });

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('🎵 Jellyfin'),
                expect.stringContaining('test message'),
                expect.stringContaining('[INFO]')
            );
        });

        it('should format warning message correctly', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            logger.warn('test message', { component: 'TestComponent' });

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('🎵 Jellyfin'),
                expect.stringContaining('test message'),
                expect.stringContaining('[WARN]')
            );
        });

        it('should format error message correctly', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            logger.error('test message', { component: 'TestComponent' });

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('🎵 Jellyfin'),
                expect.stringContaining('test message'),
                expect.stringContaining('[ERROR]')
            );
        });

        it('should handle message without component', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            logger.info('message without component');

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('🎵 Jellyfin'),
                expect.stringContaining('message without component')
            );
        });

        it('should include custom context data', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            const context: LogContext = {
                component: 'TestComponent',
                userId: 'user123',
                customData: 'test value'
            };

            logger.info('test message', context);

            expect(consoleSpy).toHaveBeenCalled();
        });

        it('should handle empty message', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            logger.info('');

            expect(consoleSpy).toHaveBeenCalled();
        });

        it('should handle complex context objects', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

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

            expect(consoleSpy).toHaveBeenCalled();
        });

        it('should handle error objects', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            const error = new Error('Test error message');
            logger.error('operation failed', { component: 'ErrorComponent', error });

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('🎵 Jellyfin'),
                expect.stringContaining('operation failed'),
                expect.stringContaining('[ERROR]')
            );
        });
    });

    describe('edge cases', () => {
        it('should handle special characters in message', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            logger.info('message with unicode: 🌍 test émojis 🎉');

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('🎵 Jellyfin'),
                expect.stringContaining('message with unicode: 🌍 test émojis 🎉')
            );
        });

        it('should handle very long messages', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            const longMessage = 'a'.repeat(1000);
            logger.info(longMessage, { component: 'LongMessageComponent' });

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('🎵 Jellyfin'),
                expect.stringContaining(longMessage)
            );
        });
    });
});
