/**
 * Live TV Views Tests
 *
 * Integration tests for live TV with playback functionality.
 */

import { describe, it, expect } from 'vitest';
import { toVideoItem } from 'lib/utils/playbackUtils';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';

describe('Live TV integration', () => {
    describe('channel playback conversion', () => {
        it('converts live TV channel to playable format', () => {
            const channel: BaseItemDto = {
                Id: 'channel-1',
                Name: 'Local News',
                Type: 'Channel',
                ServerId: 'livetv'
            };

            const playable = toVideoItem(channel);

            expect(playable.id).toBe('channel-1');
            expect(playable.title).toBe('Local News');
            expect(playable.mediaType).toBe('Video');
        });

        it('converts multiple channels to playable format', () => {
            const channels: BaseItemDto[] = [
                { Id: 'channel-1', Name: 'News', Type: 'Channel', ServerId: 'livetv' },
                { Id: 'channel-2', Name: 'Sports', Type: 'Channel', ServerId: 'livetv' },
                { Id: 'channel-3', Name: 'Movies', Type: 'Channel', ServerId: 'livetv' }
            ];

            const playables = channels.map(toVideoItem);

            expect(playables).toHaveLength(3);
            playables.forEach((item) => {
                expect(item.mediaType).toBe('Video');
            });
        });
    });

    describe('recording playback conversion', () => {
        it('converts live TV recording to playable format', () => {
            const recording: BaseItemDto = {
                Id: 'recording-1',
                Name: 'Recorded Show',
                Type: 'Recording',
                ServerId: 'livetv'
            };

            const playable = toVideoItem(recording);

            expect(playable.id).toBe('recording-1');
            expect(playable.title).toBe('Recorded Show');
            expect(playable.mediaType).toBe('Video');
        });

        it('converts multiple recordings to playable format', () => {
            const recordings: BaseItemDto[] = [
                { Id: 'rec-1', Name: 'Recording 1', Type: 'Recording', ServerId: 'livetv' },
                { Id: 'rec-2', Name: 'Recording 2', Type: 'Recording', ServerId: 'livetv' }
            ];

            const playables = recordings.map(toVideoItem);

            expect(playables).toHaveLength(2);
        });
    });

    describe('channel queuing', () => {
        it('queues single channel for playback', () => {
            const channel: BaseItemDto = {
                Id: 'channel-single',
                Name: 'Single Channel',
                Type: 'Channel',
                ServerId: 'livetv'
            };

            const queue = [toVideoItem(channel)];

            expect(queue).toHaveLength(1);
            expect(queue[0].id).toBe('channel-single');
        });

        it('queues multiple channels in order', () => {
            const channels: BaseItemDto[] = [
                { Id: 'ordered-1', Name: 'First Channel', Type: 'Channel', ServerId: 'livetv' },
                { Id: 'ordered-2', Name: 'Second Channel', Type: 'Channel', ServerId: 'livetv' },
                { Id: 'ordered-3', Name: 'Third Channel', Type: 'Channel', ServerId: 'livetv' }
            ];

            const queue = channels.map(toVideoItem);

            expect(queue).toHaveLength(3);
            expect(queue[0].title).toBe('First Channel');
            expect(queue[1].title).toBe('Second Channel');
            expect(queue[2].title).toBe('Third Channel');
        });
    });

    describe('recording queuing', () => {
        it('queues single recording for playback', () => {
            const recording: BaseItemDto = {
                Id: 'rec-single',
                Name: 'Single Recording',
                Type: 'Recording',
                ServerId: 'livetv'
            };

            const queue = [toVideoItem(recording)];

            expect(queue).toHaveLength(1);
            expect(queue[0].id).toBe('rec-single');
        });

        it('queues multiple recordings in order', () => {
            const recordings: BaseItemDto[] = [
                { Id: 'rec-ordered-1', Name: 'Recording 1', Type: 'Recording', ServerId: 'livetv' },
                { Id: 'rec-ordered-2', Name: 'Recording 2', Type: 'Recording', ServerId: 'livetv' },
                { Id: 'rec-ordered-3', Name: 'Recording 3', Type: 'Recording', ServerId: 'livetv' }
            ];

            const queue = recordings.map(toVideoItem);

            expect(queue).toHaveLength(3);
            expect(queue[0].title).toBe('Recording 1');
            expect(queue[1].title).toBe('Recording 2');
            expect(queue[2].title).toBe('Recording 3');
        });

        it('queues large recording collection', () => {
            const recordings: BaseItemDto[] = Array.from({ length: 100 }, (_, i) => ({
                Id: `rec-${i}`,
                Name: `Recording ${i + 1}`,
                Type: 'Recording' as const,
                ServerId: 'livetv'
            }));

            const queue = recordings.map(toVideoItem);

            expect(queue).toHaveLength(100);
            expect(queue[0].id).toBe('rec-0');
            expect(queue[99].id).toBe('rec-99');
        });
    });

    describe('channel types', () => {
        it('handles news channels', () => {
            const newsChannels: BaseItemDto[] = [
                { Id: 'news-1', Name: 'News Channel 1', Type: 'Channel', ServerId: 'livetv' },
                { Id: 'news-2', Name: 'News Channel 2', Type: 'Channel', ServerId: 'livetv' }
            ];

            const queue = newsChannels.map(toVideoItem);
            expect(queue).toHaveLength(2);
        });

        it('handles sports channels', () => {
            const sportsChannels: BaseItemDto[] = [
                { Id: 'sports-1', Name: 'Sports Channel 1', Type: 'Channel', ServerId: 'livetv' },
                { Id: 'sports-2', Name: 'Sports Channel 2', Type: 'Channel', ServerId: 'livetv' }
            ];

            const queue = sportsChannels.map(toVideoItem);
            expect(queue).toHaveLength(2);
        });

        it('handles movie channels', () => {
            const movieChannels: BaseItemDto[] = [
                { Id: 'movie-1', Name: 'Movie Channel 1', Type: 'Channel', ServerId: 'livetv' },
                { Id: 'movie-2', Name: 'Movie Channel 2', Type: 'Channel', ServerId: 'livetv' }
            ];

            const queue = movieChannels.map(toVideoItem);
            expect(queue).toHaveLength(2);
        });

        it('handles music channels', () => {
            const musicChannels: BaseItemDto[] = [
                { Id: 'music-1', Name: 'Music Channel 1', Type: 'Channel', ServerId: 'livetv' },
                { Id: 'music-2', Name: 'Music Channel 2', Type: 'Channel', ServerId: 'livetv' }
            ];

            const queue = musicChannels.map(toVideoItem);
            expect(queue).toHaveLength(2);
        });
    });

    describe('recording categories', () => {
        it('handles movie recordings', () => {
            const movieRecordings: BaseItemDto[] = [
                { Id: 'movie-rec-1', Name: 'Movie Recording 1', Type: 'Recording', ServerId: 'livetv' },
                { Id: 'movie-rec-2', Name: 'Movie Recording 2', Type: 'Recording', ServerId: 'livetv' }
            ];

            const queue = movieRecordings.map(toVideoItem);
            expect(queue).toHaveLength(2);
        });

        it('handles TV show recordings', () => {
            const showRecordings: BaseItemDto[] = [
                { Id: 'show-rec-1', Name: 'Show Recording 1', Type: 'Recording', ServerId: 'livetv' },
                { Id: 'show-rec-2', Name: 'Show Recording 2', Type: 'Recording', ServerId: 'livetv' }
            ];

            const queue = showRecordings.map(toVideoItem);
            expect(queue).toHaveLength(2);
        });

        it('handles sports recordings', () => {
            const sportsRecordings: BaseItemDto[] = [
                { Id: 'sports-rec-1', Name: 'Sports Recording 1', Type: 'Recording', ServerId: 'livetv' },
                { Id: 'sports-rec-2', Name: 'Sports Recording 2', Type: 'Recording', ServerId: 'livetv' }
            ];

            const queue = sportsRecordings.map(toVideoItem);
            expect(queue).toHaveLength(2);
        });
    });

    describe('error handling', () => {
        it('handles empty channel list', () => {
            const emptyChannels: BaseItemDto[] = [];
            const queue = emptyChannels.map(toVideoItem);

            expect(queue).toEqual([]);
        });

        it('handles empty recording list', () => {
            const emptyRecordings: BaseItemDto[] = [];
            const queue = emptyRecordings.map(toVideoItem);

            expect(queue).toEqual([]);
        });

        it('handles channels with missing metadata', () => {
            const channel: BaseItemDto = {
                Id: 'minimal-channel',
                Name: 'Minimal',
                Type: 'Channel',
                ServerId: 'livetv'
            };

            const playable = toVideoItem(channel);

            expect(playable.id).toBe('minimal-channel');
            expect(playable.title).toBe('Minimal');
        });

        it('handles recordings with special characters', () => {
            const recording: BaseItemDto = {
                Id: 'special-rec',
                Name: 'Recording: The Best Of (2024) & More',
                Type: 'Recording',
                ServerId: 'livetv'
            };

            const playable = toVideoItem(recording);

            expect(playable.title).toBe('Recording: The Best Of (2024) & More');
        });

        it('preserves channel metadata', () => {
            const channel: BaseItemDto = {
                Id: 'metadata-channel',
                Name: 'Channel with Metadata',
                Type: 'Channel',
                ServerId: 'livetv',
                ProductionYear: 2024
            };

            const playable = toVideoItem(channel);

            expect(playable).toMatchObject({
                id: 'metadata-channel',
                title: 'Channel with Metadata',
                year: 2024
            });
        });
    });

    describe('pagination', () => {
        it('handles paginated channel results', () => {
            const pageSize = 50;
            const page1: BaseItemDto[] = Array.from({ length: pageSize }, (_, i) => ({
                Id: `p1-channel-${i}`,
                Name: `Channel ${i + 1}`,
                Type: 'Channel' as const,
                ServerId: 'livetv'
            }));

            const page2: BaseItemDto[] = Array.from({ length: pageSize }, (_, i) => ({
                Id: `p2-channel-${i}`,
                Name: `Channel ${pageSize + i + 1}`,
                Type: 'Channel' as const,
                ServerId: 'livetv'
            }));

            const allPages = [...page1, ...page2];
            const queue = allPages.map(toVideoItem);

            expect(queue).toHaveLength(100);
            expect(queue[0].id).toBe('p1-channel-0');
            expect(queue[49].id).toBe('p1-channel-49');
            expect(queue[50].id).toBe('p2-channel-0');
            expect(queue[99].id).toBe('p2-channel-49');
        });

        it('handles paginated recording results', () => {
            const pageSize = 50;
            const page1: BaseItemDto[] = Array.from({ length: pageSize }, (_, i) => ({
                Id: `p1-rec-${i}`,
                Name: `Recording ${i + 1}`,
                Type: 'Recording' as const,
                ServerId: 'livetv'
            }));

            const page2: BaseItemDto[] = Array.from({ length: pageSize }, (_, i) => ({
                Id: `p2-rec-${i}`,
                Name: `Recording ${pageSize + i + 1}`,
                Type: 'Recording' as const,
                ServerId: 'livetv'
            }));

            const allPages = [...page1, ...page2];
            const queue = allPages.map(toVideoItem);

            expect(queue).toHaveLength(100);
        });
    });

    describe('mixed content', () => {
        it('handles mixed channels and recordings', () => {
            const items: BaseItemDto[] = [
                { Id: 'channel-1', Name: 'Channel 1', Type: 'Channel', ServerId: 'livetv' },
                { Id: 'rec-1', Name: 'Recording 1', Type: 'Recording', ServerId: 'livetv' },
                { Id: 'channel-2', Name: 'Channel 2', Type: 'Channel', ServerId: 'livetv' }
            ];

            const queue = items.map(toVideoItem);

            expect(queue).toHaveLength(3);
            queue.forEach((item) => {
                expect(item.mediaType).toBe('Video');
            });
        });

        it('queues mixed content in order', () => {
            const items: BaseItemDto[] = [
                { Id: 'c1', Name: 'Channel A', Type: 'Channel', ServerId: 'livetv' },
                { Id: 'r1', Name: 'Recording A', Type: 'Recording', ServerId: 'livetv' },
                { Id: 'c2', Name: 'Channel B', Type: 'Channel', ServerId: 'livetv' }
            ];

            const queue = items.map(toVideoItem);

            expect(queue[0].id).toBe('c1');
            expect(queue[1].id).toBe('r1');
            expect(queue[2].id).toBe('c2');
        });
    });

    describe('guide playback conversion', () => {
        it('converts live TV guide to playable format', () => {
            const guide: BaseItemDto = {
                Id: 'guide-1',
                Name: 'Popular Guide',
                Type: 'Program',
                ServerId: 'livetv'
            };

            const playable = toVideoItem(guide);

            expect(playable.id).toBe('guide-1');
            expect(playable.title).toBe('Popular Guide');
            expect(playable.mediaType).toBe('Video');
        });

        it('converts multiple guides to playable format', () => {
            const guides: BaseItemDto[] = [
                { Id: 'guide-1', Name: 'Popular Guide', Type: 'Program', ServerId: 'livetv' },
                { Id: 'guide-2', Name: 'Recently Added', Type: 'Program', ServerId: 'livetv' },
                { Id: 'guide-3', Name: 'All Guide', Type: 'Program', ServerId: 'livetv' }
            ];

            const playables = guides.map(toVideoItem);

            expect(playables).toHaveLength(3);
            playables.forEach((item) => {
                expect(item.mediaType).toBe('Video');
            });
        });
    });

    describe('guide queuing', () => {
        it('queues single guide for playback', () => {
            const guide: BaseItemDto = {
                Id: 'guide-single',
                Name: 'Single Guide',
                Type: 'Program',
                ServerId: 'livetv'
            };

            const queue = [toVideoItem(guide)];

            expect(queue).toHaveLength(1);
            expect(queue[0].id).toBe('guide-single');
        });

        it('queues multiple guides in order', () => {
            const guides: BaseItemDto[] = [
                { Id: 'g-1', Name: 'Guide 1', Type: 'Program', ServerId: 'livetv' },
                { Id: 'g-2', Name: 'Guide 2', Type: 'Program', ServerId: 'livetv' },
                { Id: 'g-3', Name: 'Guide 3', Type: 'Program', ServerId: 'livetv' }
            ];

            const queue = guides.map(toVideoItem);

            expect(queue).toHaveLength(3);
            expect(queue[0].title).toBe('Guide 1');
            expect(queue[1].title).toBe('Guide 2');
            expect(queue[2].title).toBe('Guide 3');
        });
    });

    describe('series timer playback conversion', () => {
        it('converts live TV series timer to playable format', () => {
            const timer: BaseItemDto = {
                Id: 'timer-1',
                Name: 'Active Series Timer',
                Type: 'Series',
                ServerId: 'livetv'
            };

            const playable = toVideoItem(timer);

            expect(playable.id).toBe('timer-1');
            expect(playable.title).toBe('Active Series Timer');
            expect(playable.mediaType).toBe('Video');
        });

        it('converts multiple series timers to playable format', () => {
            const timers: BaseItemDto[] = [
                { Id: 'timer-1', Name: 'Active', Type: 'Series', ServerId: 'livetv' },
                { Id: 'timer-2', Name: 'Completed', Type: 'Series', ServerId: 'livetv' }
            ];

            const playables = timers.map(toVideoItem);

            expect(playables).toHaveLength(2);
            playables.forEach((item) => {
                expect(item.mediaType).toBe('Video');
            });
        });
    });

    describe('series timer queuing', () => {
        it('queues single series timer for playback', () => {
            const timer: BaseItemDto = {
                Id: 'timer-single',
                Name: 'Single Timer',
                Type: 'Series',
                ServerId: 'livetv'
            };

            const queue = [toVideoItem(timer)];

            expect(queue).toHaveLength(1);
            expect(queue[0].id).toBe('timer-single');
        });

        it('queues multiple series timers in order', () => {
            const timers: BaseItemDto[] = [
                { Id: 'ordered-1', Name: 'First Timer', Type: 'Series', ServerId: 'livetv' },
                { Id: 'ordered-2', Name: 'Second Timer', Type: 'Series', ServerId: 'livetv' },
                { Id: 'ordered-3', Name: 'Third Timer', Type: 'Series', ServerId: 'livetv' }
            ];

            const queue = timers.map(toVideoItem);

            expect(queue).toHaveLength(3);
            expect(queue[0].title).toBe('First Timer');
            expect(queue[1].title).toBe('Second Timer');
            expect(queue[2].title).toBe('Third Timer');
        });
    });
});
