import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get, set } from 'idb-keyval';

import { createEpubLocationCache, createLocationCacheKey } from './bookPlayerLocationCache';

vi.mock('idb-keyval', () => ({
    createStore: vi.fn(),
    get: vi.fn(),
    set: vi.fn()
}));

const item = { ServerId: 'server', Id: 'book', Size: 12345 };
// eslint-disable-next-line @typescript-eslint/naming-convention -- EPUB metadata uses modified_date.
const book = { packaging: { metadata: { identifier: 'edition', modified_date: '2026-01-01' }, spine: [{}] } };

beforeEach(() => {
    vi.mocked(get).mockReset();
    vi.mocked(set).mockReset();
});

describe('EPUB location cache', () => {
    it('reuses the key for an unchanged book', () => {
        expect(createLocationCacheKey(item, book)).toBe(createLocationCacheKey({ ...item }, { packaging: { metadata: { ...book.packaging.metadata }, spine: [...book.packaging.spine] } }));
    });

    it.each([
        { ServerId: 'other server' }, { Id: 'other book' }, { Size: 54321 }
    ])('separates indexes for different items and file sizes: %j', change => {
        expect(createLocationCacheKey({ ...item, ...change }, book)).not.toBe(createLocationCacheKey(item, book));
    });

    it.each([
        { identifier: 'other edition' },
        // eslint-disable-next-line @typescript-eslint/naming-convention -- EPUB metadata uses modified_date.
        { modified_date: '2026-02-01' }
    ])('invalidates an index when publication metadata changes: %j', change => {
        const changed = { packaging: { metadata: { ...book.packaging.metadata }, spine: [...book.packaging.spine] } };
        Object.assign(changed.packaging.metadata, change);
        expect(createLocationCacheKey(item, changed)).not.toBe(createLocationCacheKey(item, book));
    });

    it('invalidates an index when the spine changes', () => {
        const changed = { packaging: { metadata: { ...book.packaging.metadata }, spine: [...book.packaging.spine] } };
        changed.packaging.spine.push({});
        expect(createLocationCacheKey(item, changed)).not.toBe(createLocationCacheKey(item, book));
    });

    it('uses the media source size when the item size is absent', () => {
        expect(createLocationCacheKey({ ...item, Size: undefined, MediaSources: [{ Size: item.Size }] }, book))
            .toBe(createLocationCacheKey(item, book));
    });

    it('loads a previously saved index', async () => {
        const cache = createEpubLocationCache(item, book);
        await cache.save('["epubcfi(saved)"]');
        vi.mocked(get).mockResolvedValue(vi.mocked(set).mock.calls[0][1]);
        expect(await cache.load()).toBe('["epubcfi(saved)"]');
    });

    it.each([undefined, { schemaVersion: 0 }, { schemaVersion: 1, breakSize: 512, locations: '[]' }])('treats missing or incompatible records as a cache miss: %j', async record => {
        vi.mocked(get).mockResolvedValue(record);
        expect(await createEpubLocationCache(item, book).load()).toBeNull();
    });

    it('allows reading when browser storage is unavailable or full', async () => {
        vi.mocked(get).mockRejectedValue(new Error('storage unavailable'));
        vi.mocked(set).mockRejectedValue(new Error('quota exceeded'));
        const cache = createEpubLocationCache(item, book);
        expect(await cache.load()).toBeNull();
        await expect(cache.save('[]')).resolves.toBeUndefined();
    });
});
