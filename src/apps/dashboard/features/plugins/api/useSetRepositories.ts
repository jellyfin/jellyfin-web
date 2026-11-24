import { isAxiosError } from 'axios';
import { useMutation } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';
import { queryClient } from 'utils/query/queryClient';
import { QueryKey } from './queryKey';
import { getPluginApi } from '@jellyfin/sdk/lib/utils/api/plugin-api';
import type { RepositoryInfo } from '@jellyfin/sdk/lib/generated-client/models/repository-info';
import { PluginApiSetRepositoriesRequest } from '@jellyfin/sdk/lib/generated-client/api/plugin-api';

export const useSetRepositories = () => {
    const { api } = useApi();
    return useMutation({
        mutationFn: async ({ validateRepository, ...params }: PluginApiSetRepositoriesRequest & { validateRepository?: RepositoryInfo }) => {
            if (validateRepository) {
                // Use the authenticated server to fetch the manifest, avoiding browser CORS restrictions.
                // Replace with the generated SDK method when it is available.
                try {
                    await api!.axiosInstance.post(`${api!.basePath}/Repositories/Validate`, validateRepository, {
                        headers: { Authorization: api!.authorizationHeader }
                    });
                } catch (error) {
                    // Older supported servers have no validation endpoint. Manifest failures
                    // from servers that support validation use 400, never 404 or 405.
                    if (!isAxiosError(error) || ![ 404, 405 ].includes(error.response?.status ?? 0)) {
                        throw error;
                    }
                }
            }

            return getPluginApi(api!).setRepositories(params);
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: [ QueryKey.Repositories ]
            });
            void queryClient.invalidateQueries({
                queryKey: [ QueryKey.Plugins ]
            });
            void queryClient.invalidateQueries({
                queryKey: [ QueryKey.Packages ]
            });
        }
    });
};
