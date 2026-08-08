import { useMutation } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';
import { queryClient } from 'utils/query/queryClient';
import { QueryKey } from './queryKey';
import { getPluginApi } from '@jellyfin/sdk/lib/utils/api/plugin-api';
import { PluginApiSetRepositoriesRequest } from '@jellyfin/sdk/lib/generated-client/api/plugin-api';

export const useSetRepositories = () => {
    const { api } = useApi();
    return useMutation({
        mutationFn: (params: PluginApiSetRepositoriesRequest) => (
            getPluginApi(api!)
                .setRepositories(params)
        ),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: [ QueryKey.Repositories ]
            });
        }
    });
};
