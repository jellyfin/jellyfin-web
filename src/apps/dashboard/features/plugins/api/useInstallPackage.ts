import type { PluginApiInstallPackageRequest } from '@jellyfin/sdk/lib/generated-client/api/plugin-api';
import { getPluginApi } from '@jellyfin/sdk/lib/utils/api/plugin-api';
import { useMutation } from '@tanstack/react-query';

import { useApi } from 'hooks/useApi';
import { queryClient } from 'utils/query/queryClient';

import { QueryKey } from './queryKey';

export const useInstallPackage = () => {
    const { api } = useApi();
    return useMutation({
        mutationFn: (params: PluginApiInstallPackageRequest) => (
            getPluginApi(api!)
                .installPackage(params)
        ),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: [ QueryKey.ConfigurationPages ]
            });
            void queryClient.invalidateQueries({
                queryKey: [ QueryKey.Plugins ]
            });
        }
    });
};
