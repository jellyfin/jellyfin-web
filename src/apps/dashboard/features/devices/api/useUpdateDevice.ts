import type { DevicesApiUpdateDeviceOptionsRequest } from '@jellyfin/sdk/lib/generated-client/api/devices-api';
import { getDevicesApi } from '@jellyfin/sdk/lib/utils/api/devices-api';
import { useMutation } from '@tanstack/react-query';

import { useApi } from 'hooks/useApi';
import { queryClient } from 'utils/query/queryClient';
import { QUERY_KEY } from './useDevices';

export const useUpdateDevice = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: (params: DevicesApiUpdateDeviceOptionsRequest) => (
            getDevicesApi(api!)
                .updateDeviceOptions(params)
        ),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: [ QUERY_KEY ]
            });
        }
    });
};
