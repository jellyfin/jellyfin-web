import { dehydrate, QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';

import { shouldDehydrateQuery } from './queryClient';

describe('shouldDehydrateQuery', () => {
    it('excludes queries that opt out of persistence', async () => {
        const client = new QueryClient();
        await client.query({ queryKey: [ 'persisted' ], queryFn: () => 'data' });
        await client.query({ queryKey: [ 'default-meta' ], queryFn: () => 'data', meta: { other: true } });
        await client.query({ queryKey: [ 'secret' ], queryFn: () => 'data', meta: { persist: false } });

        const { queries } = dehydrate(client, { shouldDehydrateQuery });

        expect(queries.map(query => query.queryKey)).toEqual([ [ 'persisted' ], [ 'default-meta' ] ]);
    });

    it('keeps the default behavior for other queries', async () => {
        const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        await client.query({
            queryKey: [ 'failed' ],
            queryFn: () => Promise.reject(new Error('failed'))
        }).catch(() => { /* the query is expected to fail */ });

        const { queries } = dehydrate(client, { shouldDehydrateQuery });

        // Only successful queries are persisted by default
        expect(queries).toHaveLength(0);
    });
});
