import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            gcTime: 1000 * 60 * 60, // keep data cached for an hour
            staleTime: 1000 * 60 * 5 // consider data stale after 5 mintues and refetch
        }
    }
});
