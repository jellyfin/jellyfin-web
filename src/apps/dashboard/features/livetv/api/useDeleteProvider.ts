import { useMutation } from '@tanstack/react-query';

import { useApi } from '@/hooks/useApi';
import { queryClient } from '@/utils/query/queryClient';
import { getLiveTvApi } from '@jellyfin/sdk/lib/utils/api/live-tv-api';
import { LiveTvApiDeleteListingProviderRequest } from '@jellyfin/sdk/lib/generated-client/api/live-tv-api';

export const useDeleteProvider = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: (params: LiveTvApiDeleteListingProviderRequest) => (
            getLiveTvApi(api!)
                .deleteListingProvider(params)
        ),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: [ 'NamedConfiguration', 'livetv' ]
            });
        }
    });
};
