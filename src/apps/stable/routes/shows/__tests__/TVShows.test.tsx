/**
 * TVShows Component Tests
 *
 * Integration tests for TV show playback functionality.
 */

import { describe, it, expect } from 'vitest';
import { toVideoItem, toVideoItems } from 'lib/utils/playbackUtils';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';

describe('TVShows integration', () => {
    describe('TV show playback conversion', () => {
        it('converts show to video playable format', () => {
            const show: BaseItemDto = {
                Id: 'show-123',
                Name: 'Test Show',
                Type: 'Series',
                ServerId: 'server-1',
                ProductionYear: 2024
            };

            const playable = toVideoItem(show);

            expect(playable.id).toBe('show-123');
            expect(playable.title).toBe('Test Show');
            expect(playable.mediaType).toBe('Video');
            expect(playable.year).toBe(2024);
        });

        it('creates valid playback queue from single show', () => {
            const show: BaseItemDto = {
                Id: 'show-1',
                Name: 'Single Show',
                Type: 'Series',
                ServerId: 'server-1'
            };

            const queue = [toVideoItem(show)];

            expect(queue).toHaveLength(1);
            expect(queue[0].mediaType).toBe('Video');
        });

        it('converts multiple shows for browsing', () => {
            const shows: BaseItemDto[] = [
                { Id: 'show-1', Name: 'Show 1', Type: 'Series', ServerId: 'server-1' },
                { Id: 'show-2', Name: 'Show 2', Type: 'Series', ServerId: 'server-1' },
                { Id: 'show-3', Name: 'Show 3', Type: 'Series', ServerId: 'server-1' }
            ];

            const playables = toVideoItems(shows);

            expect(playables).toHaveLength(3);
            playables.forEach(p => expect(p.mediaType).toBe('Video'));
        });
    });

    describe('show filtering and sorting', () => {
        it('maintains show order in filtered results', () => {
            const shows: BaseItemDto[] = [
                { Id: 'show-3', Name: 'Show C', Type: 'Series', ServerId: 'server-1' },
                { Id: 'show-1', Name: 'Show A', Type: 'Series', ServerId: 'server-1' },
                { Id: 'show-2', Name: 'Show B', Type: 'Series', ServerId: 'server-1' }
            ];

            const queue = toVideoItems(shows);

            expect(queue[0].id).toBe('show-3');
            expect(queue[1].id).toBe('show-1');
            expect(queue[2].id).toBe('show-2');
        });

        it('handles empty show list', () => {
            const emptyQueue = toVideoItems([]);
            expect(emptyQueue).toEqual([]);
        });

        it('preserves show metadata', () => {
            const show: BaseItemDto = {
                Id: 'show-1',
                Name: 'Premium Show',
                Type: 'Series',
                ServerId: 'server-1',
                ProductionYear: 2022,
                OfficialRating: 'TV-14'
            };

            const playable = toVideoItem(show);

            expect(playable).toMatchObject({
                id: 'show-1',
                title: 'Premium Show',
                year: 2022,
                mediaType: 'Video'
            });
        });
    });

    describe('playback scenarios', () => {
        it('handles shuffle with multiple shows', () => {
            const shows = Array.from({ length: 10 }, (_, i) => ({
                Id: `show-${i}`,
                Name: `Show ${i}`,
                Type: 'Series' as const,
                ServerId: 'server-1'
            }));

            const shuffled = [...shows].sort(() => Math.random() - 0.5);
            const queue = toVideoItems(shuffled);

            expect(queue).toHaveLength(10);
            queue.forEach(item => {
                expect(item.mediaType).toBe('Video');
            });
        });

        it('supports browsing paginated shows', () => {
            const allShows = Array.from({ length: 50 }, (_, i) => ({
                Id: `show-${i}`,
                Name: `Show ${i}`,
                Type: 'Series' as const,
                ServerId: 'server-1'
            }));

            const page1 = toVideoItems(allShows.slice(0, 12));
            const page2 = toVideoItems(allShows.slice(12, 24));

            expect(page1).toHaveLength(12);
            expect(page2).toHaveLength(12);
        });
    });

    describe('error handling', () => {
        it('handles shows with missing optional fields', () => {
            const minimalShow: BaseItemDto = {
                Id: 'show-1',
                Name: 'Minimal Show',
                Type: 'Series',
                ServerId: 'server-1'
            };

            const playable = toVideoItem(minimalShow);

            expect(playable.id).toBe('show-1');
            expect(playable.year).toBeUndefined();
        });
    });
});
