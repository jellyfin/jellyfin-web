import { dehydrate, QueryClient } from '@tanstack/react-query';
import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { describe, expect, it } from 'vitest';

import { queryClient, shouldDehydrateQuery } from './queryClient';

const config = {} as InternalAxiosRequestConfig;
const unauthorizedError = () => new AxiosError(
    'Request failed with status code 401',
    AxiosError.ERR_BAD_REQUEST,
    config,
    undefined,
    { status: 401, config } as AxiosResponse
);

describe('queryClient', () => {
    it('replaces the data of a query that fails with 401, so no unauthorized data is shown', async () => {
        const error = unauthorizedError();

        await expect(queryClient.query({
            queryKey: [ 'cleared' ],
            queryFn: () => Promise.reject(error),
            retry: false
        })).rejects.toBe(error);

        expect(queryClient.getQueryData([ 'cleared' ])).toBeNull();
        expect(queryClient.getQueryState([ 'cleared' ])?.error).toBeNull();
    });

    it('keeps the error of a query that opts out, e.g. when 401 is an answer before signing in', async () => {
        const error = unauthorizedError();

        await expect(queryClient.query({
            queryKey: [ 'kept' ],
            queryFn: () => Promise.reject(error),
            retry: false,
            meta: { clearOnUnauthorized: false }
        })).rejects.toBe(error);

        expect(queryClient.getQueryData([ 'kept' ])).toBeUndefined();
        expect(queryClient.getQueryState([ 'kept' ])?.error).toBe(error);
    });
});

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
