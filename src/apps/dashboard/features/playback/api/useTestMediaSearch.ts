import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { useQuery } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';

import { STRESS_TEST_ITEM_TYPES } from '../utils/transcodeTest';

/** Videos whose name matches, for choosing the capacity test's media. */
export const useTestMediaSearch = (searchTerm: string) => {
    const { api, user } = useApi();

    return useQuery({
        queryKey: [ 'TranscodeTestMedia', searchTerm ],
        queryFn: async ({ signal }) => {
            const response = await getLibraryApi(api!).getItems({
                userId: user?.Id,
                searchTerm: searchTerm || undefined,
                includeItemTypes: STRESS_TEST_ITEM_TYPES,
                recursive: true,
                limit: 20,
                enableImages: false
            }, { signal });
            return response.data.Items ?? [];
        },
        enabled: !!api,
        staleTime: 30_000
    });
};
