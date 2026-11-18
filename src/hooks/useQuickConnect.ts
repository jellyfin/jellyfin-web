import type { Api } from '@jellyfin/sdk/lib/api';
import { getAuthenticationApi } from '@jellyfin/sdk/lib/utils/api/authentication-api';
import { queryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';

import { useApi } from './useApi';

const fetchQuickConnectEnabled = async (
    api: Api,
    options?: AxiosRequestConfig
) => {
    const response = await getAuthenticationApi(api)
        .getQuickConnectEnabled(options);
    return response.data;
};

export const getQuickConnectEnabledQuery = (
    api?: Api
) => queryOptions({
    queryKey: [ 'QuickConnect', 'Enabled' ],
    queryFn: ({ signal }) => fetchQuickConnectEnabled(api!, { signal }),
    enabled: !!api
});

export const useQuickConnectEnabled = () => {
    const { api } = useApi();
    return useQuery(getQuickConnectEnabledQuery(api));
};
