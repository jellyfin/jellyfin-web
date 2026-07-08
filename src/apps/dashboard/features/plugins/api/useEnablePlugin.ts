import type { PluginApiEnablePluginRequest } from '@jellyfin/sdk/lib/generated-client/api/plugin-api';
import { getPluginApi } from '@jellyfin/sdk/lib/utils/api/plugin-api';
import { useMutation } from '@tanstack/react-query';

import { useApi } from 'hooks/useApi';
import { queryClient } from 'utils/query/queryClient';

import { QueryKey } from './queryKey';

export const useEnablePlugin = () => {
    const { api } = useApi();
    return useMutation({
        mutationFn: (params: PluginApiEnablePluginRequest) => (
            getPluginApi(api!)
                .enablePlugin(params)
        ),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: [ QueryKey.Plugins ]
            });
        }
    });
};
