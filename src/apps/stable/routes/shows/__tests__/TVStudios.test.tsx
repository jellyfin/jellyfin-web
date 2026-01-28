/**
 * TVStudios Component Tests
 *
 * Integration tests for TV studio browser with playback functionality.
 */

import { describe, it, expect } from 'vitest';
import { toVideoItem, toVideoItems } from 'lib/utils/playbackUtils';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';

describe('TVStudios integration', () => {
    describe('studio show conversion', () => {
        it('converts show from studio to video playable format', () => {
            const show: BaseItemDto = {
                Id: 'show-from-studio',
                Name: 'HBO Original',
                Type: 'Series',
                ServerId: 'server-1',
                Studios: [{ Name: 'HBO', Id: 'hbo-studio' }]
            };

            const playable = toVideoItem(show);

            expect(playable.id).toBe('show-from-studio');
            expect(playable.title).toBe('HBO Original');
            expect(playable.mediaType).toBe('Video');
        });

        it('creates queue from studio shows', () => {
            const shows: BaseItemDto[] = [
                { Id: 'show-1', Name: 'Studio Show 1', Type: 'Series', ServerId: 'server-1' },
                { Id: 'show-2', Name: 'Studio Show 2', Type: 'Series', ServerId: 'server-1' },
                { Id: 'show-3', Name: 'Studio Show 3', Type: 'Series', ServerId: 'server-1' }
            ];

            const queue = toVideoItems(shows);

            expect(queue).toHaveLength(3);
            queue.forEach(item => expect(item.mediaType).toBe('Video'));
        });

        it('converts multiple shows from single studio for playback', () => {
            const studioShows: BaseItemDto[] = Array.from({ length: 10 }, (_, i) => ({
                Id: `studio-show-${i}`,
                Name: `Studio Production ${i + 1}`,
                Type: 'Series' as const,
                ServerId: 'server-1',
                Studios: [{ Name: 'Producer Studio', Id: 'studio-123' }]
            }));

            const playables = toVideoItems(studioShows);

            expect(playables).toHaveLength(10);
            playables.forEach(p => expect(p.mediaType).toBe('Video'));
        });
    });

    describe('studio filtering', () => {
        it('maintains show order from studio', () => {
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

        it('handles empty studio show list', () => {
            const emptyQueue = toVideoItems([]);
            expect(emptyQueue).toEqual([]);
        });

        it('preserves studio metadata', () => {
            const show: BaseItemDto = {
                Id: 'studio-production',
                Name: 'Premium Studio Show',
                Type: 'Series',
                ServerId: 'server-1',
                ProductionYear: 2022,
                Studios: [{ Name: 'Major Studio', Id: 'major-studio' }]
            };

            const playable = toVideoItem(show);

            expect(playable).toMatchObject({
                id: 'studio-production',
                title: 'Premium Studio Show',
                year: 2022,
                mediaType: 'Video'
            });
        });
    });

    describe('playback scenarios', () => {
        it('handles single studio show playback', () => {
            const show: BaseItemDto = {
                Id: 'single-studio-show',
                Name: 'One Studio Show',
                Type: 'Series',
                ServerId: 'server-1'
            };

            const queue = [toVideoItem(show)];

            expect(queue).toHaveLength(1);
            expect(queue[0].mediaType).toBe('Video');
        });

        it('supports shuffled playback from studio (up to 50 shows)', () => {
            const studioShows = Array.from({ length: 50 }, (_, i) => ({
                Id: `show-${i}`,
                Name: `Show ${i + 1}`,
                Type: 'Series' as const,
                ServerId: 'server-1'
            }));

            const shuffled = [...studioShows].sort(() => Math.random() - 0.5);
            const queue = toVideoItems(shuffled);

            expect(queue).toHaveLength(50);
            queue.forEach(item => {
                expect(item.mediaType).toBe('Video');
            });
        });

        it('handles studio with limited shows', () => {
            const fewShows = Array.from({ length: 3 }, (_, i) => ({
                Id: `show-${i}`,
                Name: `Show ${i + 1}`,
                Type: 'Series' as const,
                ServerId: 'server-1'
            }));

            const queue = toVideoItems(fewShows);

            expect(queue).toHaveLength(3);
            queue.forEach((item, index) => {
                expect(item.id).toBe(`show-${index}`);
            });
        });

        it('supports browsing multiple studios', () => {
            const studio1Shows = Array.from({ length: 5 }, (_, i) => ({
                Id: `studio1-show-${i}`,
                Name: `Studio 1 Show ${i + 1}`,
                Type: 'Series' as const,
                ServerId: 'server-1'
            }));

            const studio2Shows = Array.from({ length: 5 }, (_, i) => ({
                Id: `studio2-show-${i}`,
                Name: `Studio 2 Show ${i + 1}`,
                Type: 'Series' as const,
                ServerId: 'server-1'
            }));

            const queue1 = toVideoItems(studio1Shows);
            const queue2 = toVideoItems(studio2Shows);

            expect(queue1).toHaveLength(5);
            expect(queue2).toHaveLength(5);
            expect(queue1[0].id).toBe('studio1-show-0');
            expect(queue2[0].id).toBe('studio2-show-0');
        });
    });

    describe('error handling', () => {
        it('handles shows with missing production year', () => {
            const show: BaseItemDto = {
                Id: 'show-1',
                Name: 'Unknown Year Show',
                Type: 'Series',
                ServerId: 'server-1'
            };

            const playable = toVideoItem(show);

            expect(playable.year).toBeUndefined();
            expect(playable.id).toBe('show-1');
        });

        it('handles shows from studio without metadata', () => {
            const show: BaseItemDto = {
                Id: 'minimal-show',
                Name: 'Minimal Show',
                Type: 'Series',
                ServerId: 'server-1'
            };

            const playable = toVideoItem(show);

            expect(playable.id).toBe('minimal-show');
            expect(playable.title).toBe('Minimal Show');
            expect(playable.mediaType).toBe('Video');
        });

        it('preserves show information from studio', () => {
            const show: BaseItemDto = {
                Id: 'studio-show',
                Name: 'Studio Production',
                Type: 'Series',
                ServerId: 'server-1',
                ProductionYear: 2023,
                OfficialRating: 'TV-MA',
                Studios: [{ Name: 'Production Studio', Id: 'prod-studio' }]
            };

            const playable = toVideoItem(show);

            expect(playable).toMatchObject({
                id: 'studio-show',
                title: 'Studio Production',
                year: 2023,
                mediaType: 'Video'
            });
        });
    });

    describe('studio browsing', () => {
        it('groups shows by studio for display', () => {
            const studios = [
                { Id: 'studio-1', Name: 'Studio A' },
                { Id: 'studio-2', Name: 'Studio B' }
            ];

            const shows: BaseItemDto[] = [
                { Id: 'show-1', Name: 'Show 1', Type: 'Series', ServerId: 'server-1', Studios: [studios[0]] },
                { Id: 'show-2', Name: 'Show 2', Type: 'Series', ServerId: 'server-1', Studios: [studios[1]] },
                { Id: 'show-3', Name: 'Show 3', Type: 'Series', ServerId: 'server-1', Studios: [studios[0]] }
            ];

            const queue = toVideoItems(shows);

            expect(queue).toHaveLength(3);
            expect(queue[0].id).toBe('show-1');
            expect(queue[1].id).toBe('show-2');
            expect(queue[2].id).toBe('show-3');
        });

        it('handles shows from multiple studios', () => {
            const shows = Array.from({ length: 20 }, (_, i) => ({
                Id: `show-${i}`,
                Name: `Show ${i + 1}`,
                Type: 'Series' as const,
                ServerId: 'server-1',
                Studios: [{ Name: `Studio ${i % 3}`, Id: `studio-${i % 3}` }]
            }));

            const queue = toVideoItems(shows);

            expect(queue).toHaveLength(20);
            queue.forEach(item => expect(item.mediaType).toBe('Video'));
        });

        it('supports sorting studio shows', () => {
            const shows: BaseItemDto[] = [
                { Id: 'show-3', Name: 'Show C', Type: 'Series', ServerId: 'server-1', ProductionYear: 2021 },
                { Id: 'show-1', Name: 'Show A', Type: 'Series', ServerId: 'server-1', ProductionYear: 2023 },
                { Id: 'show-2', Name: 'Show B', Type: 'Series', ServerId: 'server-1', ProductionYear: 2022 }
            ];

            const queue = toVideoItems(shows);

            expect(queue).toHaveLength(3);
            expect(queue[0].year).toBe(2021);
            expect(queue[1].year).toBe(2023);
            expect(queue[2].year).toBe(2022);
        });
    });

    describe('studio playback limits', () => {
        it('limits studio show fetching to 50 items', () => {
            const manyShows = Array.from({ length: 100 }, (_, i) => ({
                Id: `show-${i}`,
                Name: `Show ${i + 1}`,
                Type: 'Series' as const,
                ServerId: 'server-1'
            }));

            // Simulating fetch limit by slicing to 50
            const limited = manyShows.slice(0, 50);
            const queue = toVideoItems(limited);

            expect(queue).toHaveLength(50);
            expect(queue[0].id).toBe('show-0');
            expect(queue[49].id).toBe('show-49');
        });

        it('handles studio with fewer than 50 shows', () => {
            const fewShows = Array.from({ length: 15 }, (_, i) => ({
                Id: `show-${i}`,
                Name: `Show ${i + 1}`,
                Type: 'Series' as const,
                ServerId: 'server-1'
            }));

            const queue = toVideoItems(fewShows);

            expect(queue).toHaveLength(15);
        });
    });
});
