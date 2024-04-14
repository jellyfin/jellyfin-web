import type { ImageRequestParameters } from '@jellyfin/sdk/lib/models/api/image-request-parameters';
import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import { getImageApi } from '@jellyfin/sdk/lib/utils/api/image-api';
import { useQuery } from '@tanstack/react-query';
import { type JellyfinApiContext, useApi } from 'hooks/useApi';

const getUserImageUrl = (
    currentApi: JellyfinApiContext,
    user?: UserDto,
    parametersOptions?: ImageRequestParameters
) => {
    const { api } = currentApi;
    if (api) {
        return getImageApi(api).getUserImageUrl(
            user,
            parametersOptions
        );
    }
};

export const useGetUserImageUrl = (
    user?: UserDto,
    parametersOptions?: ImageRequestParameters
) => {
    const currentApi = useApi();
    return useQuery({
        queryKey: [
            'UserImageUrl',
            user,
            parametersOptions
        ],
        queryFn: () =>
            getUserImageUrl(currentApi, user, parametersOptions),
        enabled: !!parametersOptions?.tag && !!user?.Id
    });
};

