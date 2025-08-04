import type { PluginsApiUninstallPluginByVersionRequest } from '@jellyfin/sdk/lib/generated-client/api/plugins-api';
import { getPluginsApi } from '@jellyfin/sdk/lib/utils/api/plugins-api';
import { useMutation } from '@tanstack/react-query';

import { useApi } from 'hooks/useApi';
import { queryClient } from 'utils/query/queryClient';

import { QueryKey } from './queryKey';

export const useUninstallPlugin = () => {
    const { api } = useApi();
    return useMutation({
        mutationFn: (params: PluginsApiUninstallPluginByVersionRequest) =>
            getPluginsApi(api!).uninstallPluginByVersion(params),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: [QueryKey.Plugins]
            });
            void queryClient.invalidateQueries({
                queryKey: [QueryKey.ConfigurationPages]
            });
        }
    });
};
