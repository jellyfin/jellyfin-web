import type { ImageRequestParameters } from '@jellyfin/sdk/lib/models/api/image-request-parameters';
import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import { getImageApi } from '@jellyfin/sdk/lib/utils/api/image-api';
import { queryOptions, useQuery } from '@tanstack/react-query';
import { type JellyfinApiContext, useApi } from 'hooks/useApi';

const getUserImageUrl = (
    apiContext: JellyfinApiContext,
    user?: UserDto,
    params?: ImageRequestParameters
) => {
    const { api } = apiContext;

    if (!api) throw new Error('[getUserImageUrl] No API instance available');

    return getImageApi(api).getUserImageUrl(user, params);
};

export const getUserImageUrlQuery = (
    apiContext: JellyfinApiContext,
    user?: UserDto,
    params?: ImageRequestParameters
) =>
    queryOptions({
        queryKey: ['UserImageUrl', user, params],
        queryFn: () => getUserImageUrl(apiContext, user, params),
        enabled: !!apiContext.api && !!params?.tag && !!user?.Id
    });

export const useGetUserImageUrl = (
    user?: UserDto,
    params?: ImageRequestParameters
) => {
    const apiContext = useApi();
    return useQuery(getUserImageUrlQuery(apiContext, user, params));
};
