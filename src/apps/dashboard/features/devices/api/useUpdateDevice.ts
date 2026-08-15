import type { DeviceApiUpdateDeviceOptionsRequest } from '@jellyfin/sdk/lib/generated-client/api/device-api';
import { getDeviceApi } from '@jellyfin/sdk/lib/utils/api/device-api';
import { useMutation } from '@tanstack/react-query';

import { useApi } from 'hooks/useApi';
import { queryClient } from 'utils/query/queryClient';
import { QUERY_KEY } from './useDevices';

export const useUpdateDevice = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: (params: DeviceApiUpdateDeviceOptionsRequest) => (
            getDeviceApi(api!)
                .updateDeviceOptions(params)
        ),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: [ QUERY_KEY ]
            });
        }
    });
};
