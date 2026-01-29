import type { PluginsApiEnablePluginRequest } from '@jellyfin/sdk/lib/generated-client/api/plugins-api';
import { getPluginsApi } from '@jellyfin/sdk/lib/utils/api/plugins-api';
import { useMutation } from '@tanstack/react-query';

import { useApi } from 'hooks/useApi';
import { queryClient } from 'utils/query/queryClient';

import { QueryKey } from './queryKey';

export const useEnablePlugin = () => {
    const { api } = useApi();
    return useMutation({
        mutationFn: (params: PluginsApiEnablePluginRequest) =>
            getPluginsApi(api!).enablePlugin(params),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: [QueryKey.Plugins]
            });
        }
    });
};
