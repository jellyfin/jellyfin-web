import { Api } from '@jellyfin/sdk';
import { UserApiGetUserByIdRequest } from '@jellyfin/sdk/lib/generated-client';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import { useQuery } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';
import type { AxiosRequestConfig } from 'axios';

export const QUERY_KEY = 'User';

const fetchUser = async (api?: Api, params?: UserApiGetUserByIdRequest, options?: AxiosRequestConfig) => {
    if (!api) {
        console.error('[useUser] No Api instance available');
        return;
    }

    if (!params) {
        console.error('[useUser] Missing request params');
        return;
    }

    const response = await getUserApi(api).getUserById(params, options);

    return response.data;
};

export const useUser = (params?: UserApiGetUserByIdRequest) => {
    const { api } = useApi();

    return useQuery({
        queryKey: [ QUERY_KEY, params?.userId ],
        queryFn: ({ signal }) => fetchUser(api, params, { signal }),
        enabled: !!api && !!params
    });
};