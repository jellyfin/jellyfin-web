/**
 * Movie Collections Tests
 *
 * Integration tests for collections with playback functionality.
 */

import { describe, it, expect } from 'vitest';
import { toVideoItem } from 'lib/utils/playbackUtils';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';

describe('Movie Collections integration', () => {
    describe('collection item playback conversion', () => {
        it('converts movie collection to playable format', () => {
            const collection: BaseItemDto = {
                Id: 'collection-1',
                Name: 'Superhero Collection',
                Type: 'BoxSet',
                ServerId: 'server-1'
            };

            const playable = toVideoItem(collection);

            expect(playable.id).toBe('collection-1');
            expect(playable.title).toBe('Superhero Collection');
            expect(playable.mediaType).toBe('Video');
        });

        it('converts movie collection with metadata to playable format', () => {
            const collection: BaseItemDto = {
                Id: 'collection-2',
                Name: 'Action Movies',
                Type: 'BoxSet',
                ServerId: 'server-1',
                ProductionYear: 2023
            };

            const playable = toVideoItem(collection);

            expect(playable.id).toBe('collection-2');
            expect(playable.title).toBe('Action Movies');
            expect(playable.year).toBe(2023);
            expect(playable.mediaType).toBe('Video');
        });

        it('converts classic movie collection to playable format', () => {
            const collection: BaseItemDto = {
                Id: 'collection-3',
                Name: 'Golden Age Cinema',
                Type: 'BoxSet',
                ServerId: 'server-1'
            };

            const playable = toVideoItem(collection);

            expect(playable.id).toBe('collection-3');
            expect(playable.title).toBe('Golden Age Cinema');
        });
    });

    describe('collection types', () => {
        it('handles movie collections from various genres', () => {
            const collections: BaseItemDto[] = [
                { Id: 'action-1', Name: 'Action Films', Type: 'BoxSet', ServerId: 'server-1' },
                { Id: 'drama-1', Name: 'Drama Films', Type: 'BoxSet', ServerId: 'server-1' },
                { Id: 'scifi-1', Name: 'Sci-Fi Films', Type: 'BoxSet', ServerId: 'server-1' },
                { Id: 'horror-1', Name: 'Horror Films', Type: 'BoxSet', ServerId: 'server-1' }
            ];

            collections.forEach((item, index) => {
                const playable = toVideoItem(item);
                expect(playable.id).toBe(collections[index].Id);
                expect(playable.title).toBe(collections[index].Name);
                expect(playable.mediaType).toBe('Video');
            });
        });

        it('handles large movie collections', () => {
            const collections: BaseItemDto[] = Array.from({ length: 50 }, (_, i) => ({
                Id: `collection-${i}`,
                Name: `Collection ${i + 1}`,
                Type: 'BoxSet' as const,
                ServerId: 'server-1'
            }));

            const playables = collections.map(toVideoItem);

            expect(playables).toHaveLength(50);
            playables.forEach((item, index) => {
                expect(item.id).toBe(`collection-${index}`);
            });
        });

        it('handles collections with duplicate names', () => {
            const collections: BaseItemDto[] = [
                { Id: 'dup-1', Name: 'James Bond Films', Type: 'BoxSet', ServerId: 'server-1' },
                { Id: 'dup-2', Name: 'James Bond Films', Type: 'BoxSet', ServerId: 'server-1' }
            ];

            const playables = collections.map(toVideoItem);

            expect(playables).toHaveLength(2);
            expect(playables[0].id).toBe('dup-1');
            expect(playables[1].id).toBe('dup-2');
            expect(playables[0].title).toBe(playables[1].title);
        });
    });

    describe('collection queuing', () => {
        it('queues all movies from a collection', () => {
            const collectionMovies: BaseItemDto[] = [
                { Id: 'movie-1', Name: 'Movie 1', Type: 'Movie', ServerId: 'server-1' },
                { Id: 'movie-2', Name: 'Movie 2', Type: 'Movie', ServerId: 'server-1' },
                { Id: 'movie-3', Name: 'Movie 3', Type: 'Movie', ServerId: 'server-1' }
            ];

            const queue = collectionMovies.map(toVideoItem);

            expect(queue).toHaveLength(3);
            queue.forEach((item, index) => {
                expect(item.id).toBe(collectionMovies[index].Id);
            });
        });

        it('preserves movie order in collection queue', () => {
            const collectionMovies: BaseItemDto[] = [
                { Id: 'ordered-1', Name: 'First Movie', Type: 'Movie', ServerId: 'server-1' },
                { Id: 'ordered-2', Name: 'Second Movie', Type: 'Movie', ServerId: 'server-1' },
                { Id: 'ordered-3', Name: 'Third Movie', Type: 'Movie', ServerId: 'server-1' }
            ];

            const queue = collectionMovies.map(toVideoItem);

            expect(queue[0].title).toBe('First Movie');
            expect(queue[1].title).toBe('Second Movie');
            expect(queue[2].title).toBe('Third Movie');
        });

        it('handles queuing large movie collections', () => {
            const collectionMovies: BaseItemDto[] = Array.from({ length: 100 }, (_, i) => ({
                Id: `movie-${i}`,
                Name: `Movie ${i + 1}`,
                Type: 'Movie' as const,
                ServerId: 'server-1'
            }));

            const queue = collectionMovies.map(toVideoItem);

            expect(queue).toHaveLength(100);
            expect(queue[0].id).toBe('movie-0');
            expect(queue[99].id).toBe('movie-99');
        });

        it('handles queueing collection with metadata preservation', () => {
            const collectionMovies: BaseItemDto[] = [
                {
                    Id: 'meta-1',
                    Name: 'Movie with Metadata',
                    Type: 'Movie',
                    ServerId: 'server-1',
                    ProductionYear: 2022,
                    OfficialRating: 'PG-13'
                },
                {
                    Id: 'meta-2',
                    Name: 'Another Movie',
                    Type: 'Movie',
                    ServerId: 'server-1',
                    ProductionYear: 2023
                }
            ];

            const queue = collectionMovies.map(toVideoItem);

            expect(queue[0].year).toBe(2022);
            expect(queue[1].year).toBe(2023);
        });
    });

    describe('error handling', () => {
        it('handles collections with missing optional metadata', () => {
            const collection: BaseItemDto = {
                Id: 'minimal-collection',
                Name: 'Minimal Collection',
                Type: 'BoxSet',
                ServerId: 'server-1'
            };

            const playable = toVideoItem(collection);

            expect(playable.id).toBe('minimal-collection');
            expect(playable.year).toBeUndefined();
        });

        it('handles collection with special characters in name', () => {
            const collection: BaseItemDto = {
                Id: 'special-chars',
                Name: 'Collection: Best Of (2023)',
                Type: 'BoxSet',
                ServerId: 'server-1'
            };

            const playable = toVideoItem(collection);

            expect(playable.title).toBe('Collection: Best Of (2023)');
        });

        it('handles empty movie collection', () => {
            const emptyCollection: BaseItemDto[] = [];
            const queue = emptyCollection.map(toVideoItem);

            expect(queue).toEqual([]);
        });

        it('handles collection with very long name', () => {
            const longName = 'A'.repeat(200);
            const collection: BaseItemDto = {
                Id: 'long-name-collection',
                Name: longName,
                Type: 'BoxSet',
                ServerId: 'server-1'
            };

            const playable = toVideoItem(collection);

            expect(playable.title).toBe(longName);
            expect(playable.title).toHaveLength(200);
        });

        it('preserves collection metadata for playback', () => {
            const collection: BaseItemDto = {
                Id: 'metadata-collection',
                Name: 'Collection with Metadata',
                Type: 'BoxSet',
                ServerId: 'server-1',
                ProductionYear: 2023
            };

            const playable = toVideoItem(collection);

            expect(playable).toMatchObject({
                id: 'metadata-collection',
                title: 'Collection with Metadata',
                year: 2023,
                mediaType: 'Video'
            });
        });
    });

    describe('collection browsing', () => {
        it('handles multiple collection types in view', () => {
            const collections: BaseItemDto[] = [
                { Id: 'franchise-1', Name: 'Avengers Franchise', Type: 'BoxSet', ServerId: 'server-1' },
                { Id: 'director-1', Name: 'Tarantino Films', Type: 'BoxSet', ServerId: 'server-1' },
                { Id: 'era-1', Name: '80s Action', Type: 'BoxSet', ServerId: 'server-1' }
            ];

            const playables = collections.map(toVideoItem);

            expect(playables).toHaveLength(3);
            playables.forEach((item) => {
                expect(item.mediaType).toBe('Video');
            });
        });

        it('handles collections displayed in grid', () => {
            const gridCollections: BaseItemDto[] = Array.from({ length: 12 }, (_, i) => ({
                Id: `grid-${i}`,
                Name: `Collection ${i + 1}`,
                Type: 'BoxSet' as const,
                ServerId: 'server-1'
            }));

            const displayed = gridCollections.slice(0, 12).map(toVideoItem);

            expect(displayed).toHaveLength(12);
            displayed.forEach((item, index) => {
                expect(item.title).toBe(`Collection ${index + 1}`);
            });
        });

        it('handles collection pagination', () => {
            const pageSize = 24;
            const page1: BaseItemDto[] = Array.from({ length: pageSize }, (_, i) => ({
                Id: `page1-${i}`,
                Name: `Page 1 Collection ${i + 1}`,
                Type: 'BoxSet' as const,
                ServerId: 'server-1'
            }));

            const page2: BaseItemDto[] = Array.from({ length: pageSize }, (_, i) => ({
                Id: `page2-${i}`,
                Name: `Page 2 Collection ${i + 1}`,
                Type: 'BoxSet' as const,
                ServerId: 'server-1'
            }));

            const allPages = [...page1, ...page2];
            const playables = allPages.map(toVideoItem);

            expect(playables).toHaveLength(48);
            expect(playables[0].id).toBe('page1-0');
            expect(playables[23].id).toBe('page1-23');
            expect(playables[24].id).toBe('page2-0');
            expect(playables[47].id).toBe('page2-23');
        });

        it('handles collection sorting options', () => {
            const sortOptions = [
                { name: 'By Name', items: ['Z Collection', 'A Collection', 'M Collection'] },
                { name: 'By Date Created', items: ['Oldest', 'Middle', 'Newest'] },
                { name: 'By Date Modified', items: ['Updated', 'Recent', 'Old'] }
            ];

            sortOptions.forEach((option) => {
                const collections: BaseItemDto[] = option.items.map((name, i) => ({
                    Id: `sort-${i}`,
                    Name: name,
                    Type: 'BoxSet' as const,
                    ServerId: 'server-1'
                }));

                const playables = collections.map(toVideoItem);
                expect(playables).toHaveLength(option.items.length);
            });
        });
    });

    describe('collection movie details', () => {
        it('handles movies with various ratings', () => {
            const movies: BaseItemDto[] = [
                { Id: 'm-1', Name: 'G Movie', Type: 'Movie', ServerId: 'server-1', OfficialRating: 'G' },
                { Id: 'm-2', Name: 'PG Movie', Type: 'Movie', ServerId: 'server-1', OfficialRating: 'PG' },
                { Id: 'm-3', Name: 'R Movie', Type: 'Movie', ServerId: 'server-1', OfficialRating: 'R' }
            ];

            const queue = movies.map(toVideoItem);

            expect(queue).toHaveLength(3);
            queue.forEach((item) => {
                expect(item.mediaType).toBe('Video');
            });
        });

        it('handles movies with various release years', () => {
            const movies: BaseItemDto[] = [
                { Id: 'year-1', Name: '1980s Movie', Type: 'Movie', ServerId: 'server-1', ProductionYear: 1985 },
                { Id: 'year-2', Name: '2000s Movie', Type: 'Movie', ServerId: 'server-1', ProductionYear: 2005 },
                { Id: 'year-3', Name: '2020s Movie', Type: 'Movie', ServerId: 'server-1', ProductionYear: 2023 }
            ];

            const queue = movies.map(toVideoItem);

            expect(queue[0].year).toBe(1985);
            expect(queue[1].year).toBe(2005);
            expect(queue[2].year).toBe(2023);
        });

        it('handles collection with mixed movie types', () => {
            const movies: BaseItemDto[] = [
                { Id: 'movie-1', Name: 'Feature Film', Type: 'Movie', ServerId: 'server-1' },
                { Id: 'movie-2', Name: 'Short Film', Type: 'Movie', ServerId: 'server-1' },
                { Id: 'movie-3', Name: 'Documentary', Type: 'Movie', ServerId: 'server-1' }
            ];

            const queue = movies.map(toVideoItem);

            expect(queue).toHaveLength(3);
            queue.forEach((item) => {
                expect(item.mediaType).toBe('Video');
            });
        });
    });
});
