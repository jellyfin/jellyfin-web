import type { PackageApiInstallPackageRequest } from '@jellyfin/sdk/lib/generated-client/api/package-api';
import { getPackageApi } from '@jellyfin/sdk/lib/utils/api/package-api';
import { useMutation } from '@tanstack/react-query';

import { useApi } from 'hooks/useApi';
import { queryClient } from 'utils/query/queryClient';

import { QueryKey } from './queryKey';

export const useInstallPackage = () => {
    const { api } = useApi();
    return useMutation({
        mutationFn: (params: PackageApiInstallPackageRequest) => (
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            getPackageApi(api!)
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
