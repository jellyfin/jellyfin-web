import { useMutation } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';
import { queryClient } from 'utils/query/queryClient';
import { QueryKey } from './queryKey';
import { getPackageApi } from '@jellyfin/sdk/lib/utils/api/package-api';
import { PackageApiSetRepositoriesRequest } from '@jellyfin/sdk/lib/generated-client/api/package-api';

export const useSetRepositories = () => {
    const { api } = useApi();
    return useMutation({
        mutationFn: (params: PackageApiSetRepositoriesRequest) => (
            getPackageApi(api!)
                .setRepositories(params)
        ),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: [ QueryKey.Repositories ]
            });
        }
    });
};
