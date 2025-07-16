import type { Api } from '@jellyfin/sdk';
import { getSystemApi } from '@jellyfin/sdk/lib/utils/api/system-api';
import { queryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';

import { useApi } from 'hooks/useApi';

const fetchSystemStorage = async (
    api: Api,
    options?: AxiosRequestConfig
) => {
    const response = await getSystemApi(api)
        .getSystemStorage(options);
    return response.data;
};

const getSystemStorageQuery = (
    api?: Api
) => queryOptions({
    queryKey: [ 'SystemStorage' ],
    queryFn: ({ signal }) => fetchSystemStorage(api!, { signal }),
    enabled: !!api
});

export const useSystemStorage = () => {
    const { api } = useApi();
    return useQuery(getSystemStorageQuery(api));
};
