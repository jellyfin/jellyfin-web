import { QueryClient } from '@tanstack/react-query';
import type { PersistedClient, Persister } from '@tanstack/react-query-persist-client';
import { get, set, del } from 'idb-keyval';

// TODO: Move this file to lib/query

export const queryClient = new QueryClient({
    defaultOptions: {
        mutations: {
            networkMode: 'always' // network connection is not required if running on localhost
        },
        queries: {
            gcTime: 24 * 60 * 60 * 1000, // set garbage collection to 24 hours for persistence
            networkMode: 'always', // network connection is not required if running on localhost
            staleTime: 5 * 60 * 1000 // set stale time to 5 minutes to prevent excessive fetching
        }
    }
});

/** Create an IndexedDB persister for react-query-persist-client. Uses idb-keyval for simplicity. */
const createIDBPersister = (idbValidKey: IDBValidKey = 'query-cache') => ({
    persistClient: async (client: PersistedClient) => {
        await set(idbValidKey, client);
    },
    restoreClient: () => {
        return get<PersistedClient>(idbValidKey);
    },
    removeClient: async () => {
        await del(idbValidKey);
    }
} satisfies Persister);

export const persister = createIDBPersister('jellyfin-query-cache');
