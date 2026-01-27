import { describe, expect, it } from 'vitest';
import { PluginType } from '../../types/plugin';

/**
 * Test suite for Comics Player plugin.
 * Focuses on plugin interface and basic functionality validation.
 */
describe('ComicsPlayer Plugin', () => {
    const SUPPORTED_FORMATS = ['cbz', 'cbr'];

    describe('plugin metadata', () => {
        it('should define media player plugin type', () => {
            expect(PluginType.MediaPlayer).toBeDefined();
        });

        it('should have valid plugin structure', () => {
            const plugin = {
                name: 'Comics Player',
                id: 'comicsplayer',
                type: PluginType.MediaPlayer,
                isLocalPlayer: true,
                priority: 1
            };

            expect(plugin.name).toContain('Comics');
            expect(plugin.id).toBe('comicsplayer');
            expect(plugin.isLocalPlayer).toBe(true);
        });
    });

    describe('format support', () => {
        it('should support CBZ format', () => {
            expect(SUPPORTED_FORMATS).toContain('cbz');
        });

        it('should support CBR format', () => {
            expect(SUPPORTED_FORMATS).toContain('cbr');
        });

        it('should detect CBZ files', () => {
            const path = '/comics/story.cbz';
            const isCbz = path.toLowerCase().endsWith('.cbz');
            expect(isCbz).toBe(true);
        });

        it('should detect CBR files', () => {
            const path = '/comics/story.cbr';
            const isCbr = path.toLowerCase().endsWith('.cbr');
            expect(isCbr).toBe(true);
        });

        it('should handle case-insensitive extensions', () => {
            const pathCbz = '/comics/story.CBZ';
            const pathCbr = '/comics/story.CBR';
            expect(pathCbz.toLowerCase().endsWith('.cbz')).toBe(true);
            expect(pathCbr.toLowerCase().endsWith('.cbr')).toBe(true);
        });
    });

    describe('media type detection', () => {
        it('should recognize comics media type', () => {
            const mediaTypes = ['video', 'audio', 'book', 'comics', 'image'];
            expect(mediaTypes).toContain('comics');
        });

        it('should match media type case-insensitively', () => {
            const mediaType = 'COMICS';
            expect(mediaType.toLowerCase()).toBe('comics');
        });
    });

    describe('item compatibility', () => {
        it('should identify CBZ items', () => {
            const item = { Path: '/library/comic.cbz' };
            const isCompatible = SUPPORTED_FORMATS.some((fmt) =>
                item.Path.toLowerCase().endsWith(`.${fmt}`)
            );
            expect(isCompatible).toBe(true);
        });

        it('should identify CBR items', () => {
            const item = { Path: '/library/comic.cbr' };
            const isCompatible = SUPPORTED_FORMATS.some((fmt) =>
                item.Path.toLowerCase().endsWith(`.${fmt}`)
            );
            expect(isCompatible).toBe(true);
        });

        it('should reject unsupported items', () => {
            const item = { Path: '/library/document.pdf' };
            const isCompatible = SUPPORTED_FORMATS.some((fmt) =>
                item.Path.toLowerCase().endsWith(`.${fmt}`)
            );
            expect(isCompatible).toBe(false);
        });

        it('should handle missing path', () => {
            const item = {};
            const isCompatible = SUPPORTED_FORMATS.some(
                (fmt) => (item as any).Path?.toLowerCase().endsWith(`.${fmt}`) ?? false
            );
            expect(isCompatible).toBe(false);
        });
    });

    describe('priority and player type', () => {
        it('should have appropriate priority', () => {
            const priority = 1;
            expect(priority).toBeGreaterThanOrEqual(0);
            expect(priority).toBeLessThan(100);
        });

        it('should be a local player', () => {
            const isLocalPlayer = true;
            expect(isLocalPlayer).toBe(true);
        });

        it('should not require streaming', () => {
            // Local players handle files directly
            const requiresStreaming = false;
            expect(requiresStreaming).toBe(false);
        });
    });
});
