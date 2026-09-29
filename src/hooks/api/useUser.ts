import { Api } from '@jellyfin/sdk';
import type { UserApiGetUserByIdRequest } from '@jellyfin/sdk/lib/generated-client/api/user-api';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import { queryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';

import { useApi } from 'hooks/useApi';

/** UserApiGetUserByIdRequest without required userId */
interface GetUserByIdParams {
    userId?: string;
}

export const QUERY_KEY = 'User';

const fetchUser = async (
    api: Api,
    params: UserApiGetUserByIdRequest,
    options?: AxiosRequestConfig
) => {
    const response = await getUserApi(api).getUserById(params, options);

    return response.data;
};

export const getUserQuery = (
    api?: Api,
    { userId }: GetUserByIdParams = {}
) => queryOptions({
    queryKey: [ QUERY_KEY, userId ],
    queryFn: ({ signal }) => fetchUser(api!, { userId: userId! }, { signal }),
    enabled: !!api && !!userId
});

export const useUser = ({ userId }: GetUserByIdParams) => {
    const { api, user } = useApi();

    return useQuery(getUserQuery(api, { userId: userId || user?.Id }));
};
