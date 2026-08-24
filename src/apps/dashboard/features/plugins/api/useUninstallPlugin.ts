import type { PluginApiUninstallPluginByVersionRequest } from '@jellyfin/sdk/lib/generated-client/api/plugin-api';
import { getPluginApi } from '@jellyfin/sdk/lib/utils/api/plugin-api';
import { useMutation } from '@tanstack/react-query';

import { useApi } from 'hooks/useApi';
import { queryClient } from 'utils/query/queryClient';

import { QueryKey } from './queryKey';

export const useUninstallPlugin = () => {
    const { api } = useApi();
    return useMutation({
        mutationFn: (params: PluginApiUninstallPluginByVersionRequest) => (
            getPluginApi(api!)
                .uninstallPluginByVersion(params)
        ),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: [ QueryKey.Plugins ]
            });
            void queryClient.invalidateQueries({
                queryKey: [ QueryKey.ConfigurationPages ]
            });
        }
    });
};
