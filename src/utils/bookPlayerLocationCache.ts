import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import type { PackagingMetadataObject } from 'epubjs/types/packaging';
import { createStore, get, set } from 'idb-keyval';

import { LOCATION_BREAK_SIZE } from './bookPlayerLocations';

const CACHE_SCHEMA_VERSION = 1;
const store = createStore('jellyfin-reader-cache', 'epubLocations');

type CacheItem = Pick<BaseItemDto, 'ServerId' | 'Id' | 'MediaSources'> & { Size?: number | null };
interface CacheBook {
    packaging?: {
        metadata?: Partial<Pick<PackagingMetadataObject, 'identifier' | 'modified_date'>>;
        spine?: unknown[];
    };
}

interface CacheRecord {
    schemaVersion: number;
    breakSize: number;
    locations: string;
}

export function createLocationCacheKey(item: CacheItem, book: CacheBook) {
    const metadata = book.packaging?.metadata;
    return JSON.stringify([
        CACHE_SCHEMA_VERSION,
        LOCATION_BREAK_SIZE,
        item.ServerId || '',
        item.Id || '',
        item.Size || item.MediaSources?.[0]?.Size || '',
        metadata?.identifier || '',
        metadata?.modified_date || '',
        book.packaging?.spine?.length || ''
    ]);
}

export function createEpubLocationCache(item: CacheItem, book: CacheBook) {
    const key = createLocationCacheKey(item, book);
    return {
        async load() {
            try {
                const record = await get<CacheRecord>(key, store);
                if (record?.schemaVersion === CACHE_SCHEMA_VERSION
                    && record.breakSize === LOCATION_BREAK_SIZE
                    && typeof record.locations === 'string') {
                    return record.locations;
                }
            } catch {
                // Private browsing or storage errors must not prevent reading.
            }
            return null;
        },
        async save(locations: string) {
            try {
                await set(key, {
                    schemaVersion: CACHE_SCHEMA_VERSION,
                    breakSize: LOCATION_BREAK_SIZE,
                    locations
                }, store);
            } catch {
                // The next open can regenerate the index if storage is full.
            }
        }
    };
}
