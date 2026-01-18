import { StartupApiSetRemoteAccessRequest } from '@jellyfin/sdk/lib/generated-client/api/startup-api';
import { getStartupApi } from '@jellyfin/sdk/lib/utils/api/startup-api';
import { useMutation } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';

export const useSetRemoteAccess = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: (params: StartupApiSetRemoteAccessRequest) => (
            getStartupApi(api!)
                .setRemoteAccess(params)
        )
    });
};
