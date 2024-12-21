import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        mutations: {
            networkMode: 'always' // network connection is not required if running on localhost
        },
        queries: {
            networkMode: 'always' // network connection is not required if running on localhost
        }
    }
});
