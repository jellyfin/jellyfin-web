import type { Api } from '@jellyfin/sdk/lib/api';
import { DisplayPreferencesApiGetDisplayPreferencesRequest } from '@jellyfin/sdk/lib/generated-client/api/display-preferences-api';
import { getDisplayPreferencesApi } from '@jellyfin/sdk/lib/utils/api/display-preferences-api';
import { queryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';

import { useApi } from 'hooks/useApi';

const fetchDisplayPreferences = async (
    api: Api,
    params: DisplayPreferencesApiGetDisplayPreferencesRequest,
    options?: AxiosRequestConfig
) => {
    const response = await getDisplayPreferencesApi(api)
        .getDisplayPreferences(params, options);
    return response.data;
};

export const getDisplayPreferencesQuery = (
    api?: Api,
    params?: DisplayPreferencesApiGetDisplayPreferencesRequest
) => queryOptions({
    queryKey: [ 'User', params?.userId, 'DisplayPreferences', params?.displayPreferencesId, params?.client ],
    queryFn: ({ signal }) => fetchDisplayPreferences(api!, params!, { signal }),
    enabled: !!api && !!params
});

export const useDisplayPreferences = (
    params: DisplayPreferencesApiGetDisplayPreferencesRequest
) => {
    const { api, user } = useApi();
    return useQuery(getDisplayPreferencesQuery(api, {
        ...params,
        userId: params?.userId || user?.Id
    }));
};
