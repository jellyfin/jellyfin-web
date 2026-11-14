import type { Api } from '@jellyfin/sdk';
import type { LibraryApiGetItemsRequest } from '@jellyfin/sdk/lib/generated-client/api/library-api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getItems } from './getItems';

const getItemsMock = vi.fn();

vi.mock('@jellyfin/sdk/lib/utils/api/library-api', () => ({
    getLibraryApi: () => ({ getItems: getItemsMock })
}));

const api = {} as Api;

const makeIds = (count: number) => Array.from({ length: count }, (_, i) => `id${i}`);

/** Echoes the requested ids back as items. */
const echo = (params?: LibraryApiGetItemsRequest) => {
    const items = (params?.ids ?? []).map(Id => ({ Id }));
    return Promise.resolve({ data: { Items: items, TotalRecordCount: items.length, StartIndex: 0 } });
};

/**
 * The ids sent in each request, in call order. The helper builds a new params object per
 * chunk, but snapshot anyway so a later mutation cannot change what a test sees.
 */
const requestedIds = () => getItemsMock.mock.calls.map(([ params ]) => [ ...(params?.ids ?? []) ]);

describe('getItems', () => {
    beforeEach(() => {
        getItemsMock.mockReset();
        getItemsMock.mockImplementation(echo);
        vi.spyOn(console, 'log').mockImplementation(() => { /* silence */ });
    });

    describe('without splitting', () => {
        it('passes the request straight through when there are no ids', async () => {
            const params = { limit: 5 };

            await getItems(api, params);

            expect(getItemsMock).toHaveBeenCalledTimes(1);
            expect(getItemsMock).toHaveBeenCalledWith(params);
        });

        it('returns the response data', async () => {
            const data = { Items: [{ Id: 'a' }], TotalRecordCount: 1 };
            getItemsMock.mockResolvedValue({ data });

            await expect(getItems(api, {})).resolves.toBe(data);
        });

        it('makes a single request for exactly 40 ids', async () => {
            const params = { ids: makeIds(40) };

            const result = await getItems(api, params);

            expect(getItemsMock).toHaveBeenCalledTimes(1);
            expect(getItemsMock).toHaveBeenCalledWith(params);
            expect(result.Items).toHaveLength(40);
        });
    });

    describe('splitting', () => {
        it('splits 41 ids into requests of 40 and 1', async () => {
            await getItems(api, { ids: makeIds(41) });

            expect(requestedIds().map(ids => ids.length)).toEqual([ 40, 1 ]);
        });

        it('splits 100 ids into requests of 40, 40 and 20, in order', async () => {
            const ids = makeIds(100);

            await getItems(api, { ids });

            const requested = requestedIds();
            expect(requested.map(r => r.length)).toEqual([ 40, 40, 20 ]);
            expect(requested.flat()).toEqual(ids);
        });

        it('keeps the other params on every request and does not mutate the input', async () => {
            const params = { ids: makeIds(50), recursive: true, userId: 'user' };
            const original = { ...params, ids: [ ...params.ids ] };

            await getItems(api, params);

            for (const [ request ] of getItemsMock.mock.calls) {
                expect(request).toMatchObject({ recursive: true, userId: 'user' });
            }
            expect(params).toEqual(original);
        });

        it('stops requesting ids beyond limit', async () => {
            await getItems(api, { ids: makeIds(100), limit: 50 });

            expect(requestedIds().map(ids => ids.length)).toEqual([ 40, 10 ]);
        });
    });

    describe('merging', () => {
        it('concatenates items in order and sums TotalRecordCount', async () => {
            const ids = makeIds(85);

            const result = await getItems(api, { ids });

            expect(result.Items?.map(i => i.Id)).toEqual(ids);
            expect(result.TotalRecordCount).toBe(85);
            expect(result.StartIndex).toBe(0);
        });

        // Characterization: these document the behavior carried over from the legacy helper, including quirks.
        it('drops a chunk whose result has no Items', async () => {
            getItemsMock
                .mockResolvedValueOnce({ data: { TotalRecordCount: 1, StartIndex: 0 } })
                .mockResolvedValueOnce({ data: { Items: [{ Id: 'b' }], TotalRecordCount: 1, StartIndex: 0 } });

            const result = await getItems(api, { ids: makeIds(50) });

            expect(result.Items).toEqual([{ Id: 'b' }]);
        });

        it('drops a chunk whose TotalRecordCount is 0 or missing, even when it has Items', async () => {
            getItemsMock
                .mockResolvedValueOnce({ data: { Items: [{ Id: 'a' }], TotalRecordCount: 0, StartIndex: 0 } })
                .mockResolvedValueOnce({ data: { Items: [{ Id: 'b' }], TotalRecordCount: 1, StartIndex: 0 } });

            const result = await getItems(api, { ids: makeIds(50) });

            expect(result.Items).toEqual([{ Id: 'b' }]);
        });

        it('drops a chunk whose StartIndex is undefined', async () => {
            getItemsMock
                .mockResolvedValueOnce({ data: { Items: [{ Id: 'a' }], TotalRecordCount: 1 } })
                .mockResolvedValueOnce({ data: { Items: [{ Id: 'b' }], TotalRecordCount: 1, StartIndex: 0 } });

            const result = await getItems(api, { ids: makeIds(50) });

            expect(result.Items).toEqual([{ Id: 'b' }]);
        });

        it('rejects when any request fails', async () => {
            getItemsMock
                .mockResolvedValueOnce({ data: { Items: [], TotalRecordCount: 0, StartIndex: 0 } })
                .mockRejectedValueOnce(new Error('boom'));

            await expect(getItems(api, { ids: makeIds(100) })).rejects.toThrow('boom');
        });
    });
});
