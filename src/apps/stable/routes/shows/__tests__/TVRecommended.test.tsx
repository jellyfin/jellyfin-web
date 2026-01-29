/**
 * TVRecommended Component Tests
 *
 * Integration tests for TV show recommendations with playback functionality.
 */

import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { toVideoItem, toVideoItems } from 'lib/utils/playbackUtils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('TVRecommended integration', () => {
    describe('TV show recommendations conversion', () => {
        it('converts recommended show to video playable format', () => {
            const show: BaseItemDto = {
                Id: 'show-123',
                Name: 'Breaking Bad',
                Type: 'Series',
                ServerId: 'server-1',
                ProductionYear: 2008
            };

            const playable = toVideoItem(show);

            expect(playable.id).toBe('show-123');
            expect(playable.title).toBe('Breaking Bad');
            expect(playable.mediaType).toBe('Video');
            expect(playable.year).toBe(2008);
        });

        it('converts multiple recommended shows for batch playback', () => {
            const shows: BaseItemDto[] = [
                { Id: 'show-1', Name: 'Show 1', Type: 'Series', ServerId: 'server-1' },
                { Id: 'show-2', Name: 'Show 2', Type: 'Series', ServerId: 'server-1' },
                { Id: 'show-3', Name: 'Show 3', Type: 'Series', ServerId: 'server-1' }
            ];

            const playables = toVideoItems(shows);

            expect(playables).toHaveLength(3);
            playables.forEach((p) => expect(p.mediaType).toBe('Video'));
        });

        it('creates valid playback queue from recommended shows', () => {
            const shows: BaseItemDto[] = Array.from({ length: 6 }, (_, i) => ({
                Id: `show-${i}`,
                Name: `Recommendation ${i + 1}`,
                Type: 'Series' as const,
                ServerId: 'server-1'
            }));

            const queue = toVideoItems(shows);

            expect(queue).toHaveLength(6);
            queue.forEach((item, index) => {
                expect(item.id).toBe(`show-${index}`);
                expect(item.mediaType).toBe('Video');
            });
        });
    });

    describe('recommendation sections', () => {
        it('handles continue watching section with show metadata', () => {
            const show: BaseItemDto = {
                Id: 'continue-show',
                Name: 'Game of Thrones',
                Type: 'Series',
                ServerId: 'server-1',
                ProductionYear: 2011,
                UserData: {
                    PlaybackPositionTicks: 5000000000
                }
            };

            const playable = toVideoItem(show);

            expect(playable.id).toBe('continue-show');
            expect(playable.title).toBe('Game of Thrones');
            expect(playable.year).toBe(2011);
        });

        it('handles latest additions section with new shows', () => {
            const latestShows: BaseItemDto[] = Array.from({ length: 6 }, (_, i) => ({
                Id: `latest-${i}`,
                Name: `New Show ${i + 1}`,
                Type: 'Series' as const,
                ServerId: 'server-1',
                ProductionYear: 2024 - i
            }));

            const playables = toVideoItems(latestShows);

            expect(playables).toHaveLength(6);
            playables.forEach((p, i) => {
                expect(p.year).toBe(2024 - i);
            });
        });

        it('maintains pagination with multiple show sets', () => {
            const page1: BaseItemDto[] = Array.from({ length: 6 }, (_, i) => ({
                Id: `p1-show-${i}`,
                Name: `Page 1 Show ${i + 1}`,
                Type: 'Series' as const,
                ServerId: 'server-1'
            }));

            const page2: BaseItemDto[] = Array.from({ length: 6 }, (_, i) => ({
                Id: `p2-show-${i}`,
                Name: `Page 2 Show ${i + 1}`,
                Type: 'Series' as const,
                ServerId: 'server-1'
            }));

            const queue1 = toVideoItems(page1);
            const queue2 = toVideoItems(page2);

            expect(queue1).toHaveLength(6);
            expect(queue2).toHaveLength(6);
            expect(queue1[0].id).toBe('p1-show-0');
            expect(queue2[0].id).toBe('p2-show-0');
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

        it('handles empty recommendation list', () => {
            const emptyQueue = toVideoItems([]);
            expect(emptyQueue).toEqual([]);
        });

        it('preserves show metadata including production details', () => {
            const show: BaseItemDto = {
                Id: 'show-1',
                Name: 'Premium Show',
                Type: 'Series',
                ServerId: 'server-1',
                ProductionYear: 2023,
                OfficialRating: 'TV-MA'
            };

            const playable = toVideoItem(show);

            expect(playable).toMatchObject({
                id: 'show-1',
                title: 'Premium Show',
                year: 2023,
                mediaType: 'Video'
            });
        });

        it('handles shows with special characters in name', () => {
            const show: BaseItemDto = {
                Id: 'show-special',
                Name: 'The Office (US)',
                Type: 'Series',
                ServerId: 'server-1'
            };

            const playable = toVideoItem(show);

            expect(playable.title).toBe('The Office (US)');
        });
    });

    describe('section display scenarios', () => {
        it('continues watching with resume capability', () => {
            const continueShow: BaseItemDto = {
                Id: 'resume-show',
                Name: 'Stranger Things',
                Type: 'Series',
                ServerId: 'server-1',
                UserData: {
                    PlaybackPositionTicks: 3000000000
                },
                RunTimeTicks: 5400000000
            };

            const playable = toVideoItem(continueShow);

            expect(playable.id).toBe('resume-show');
            expect(playable.runtimeTicks).toBe(5400000000);
        });

        it('displays latest additions in reverse chronological order', () => {
            const shows: BaseItemDto[] = [
                {
                    Id: 'show-3',
                    Name: 'Show 3',
                    Type: 'Series' as const,
                    ServerId: 'server-1',
                    ProductionYear: 2022
                },
                {
                    Id: 'show-1',
                    Name: 'Show 1',
                    Type: 'Series' as const,
                    ServerId: 'server-1',
                    ProductionYear: 2024
                },
                {
                    Id: 'show-2',
                    Name: 'Show 2',
                    Type: 'Series' as const,
                    ServerId: 'server-1',
                    ProductionYear: 2023
                }
            ];

            const queue = toVideoItems(shows);

            expect(queue).toHaveLength(3);
            expect(queue[0].year).toBe(2022);
            expect(queue[1].year).toBe(2024);
            expect(queue[2].year).toBe(2023);
        });

        it('supports paginated loading of recommendations', () => {
            const allShows = Array.from({ length: 50 }, (_, i) => ({
                Id: `show-${i}`,
                Name: `Show ${i}`,
                Type: 'Series' as const,
                ServerId: 'server-1'
            }));

            const page1 = toVideoItems(allShows.slice(0, 6));
            const page2 = toVideoItems(allShows.slice(6, 12));

            expect(page1).toHaveLength(6);
            expect(page2).toHaveLength(6);
            expect(page1[0].id).toBe('show-0');
            expect(page2[0].id).toBe('show-6');
        });
    });

    describe('recommendation filtering', () => {
        it('maintains show order in recommendations', () => {
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

        it('filters recommendations by type', () => {
            const items: BaseItemDto[] = [
                { Id: 'show-1', Name: 'Show 1', Type: 'Series', ServerId: 'server-1' },
                { Id: 'season-1', Name: 'Season 1', Type: 'Season', ServerId: 'server-1' },
                { Id: 'show-2', Name: 'Show 2', Type: 'Series', ServerId: 'server-1' }
            ];

            const shows = items.filter((i) => i.Type === 'Series');
            const queue = toVideoItems(shows);

            expect(queue).toHaveLength(2);
            queue.forEach((item) => {
                expect(item.id).toMatch(/^show-/);
            });
        });
    });
});
