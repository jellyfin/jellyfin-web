import type { AxiosRequestConfig } from 'axios';
import type { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import { getStudioApi } from '@jellyfin/sdk/lib/utils/api/studio-api';
import { useQuery } from '@tanstack/react-query';

import { type JellyfinApiContext, useApi } from 'hooks/useApi';
import type { ParentId } from 'types/library';

const fetchGetStudios = async (
    currentApi: JellyfinApiContext,
    parentId: ParentId,
    itemType: BaseItemKind[],
    options?: AxiosRequestConfig
) => {
    const { api, user } = currentApi;
    if (api && user?.Id) {
        const response = await getStudioApi(api).getStudios(
            {
                userId: user.Id,
                includeItemTypes: itemType,
                fields: [
                    ItemFields.DateCreated,
                    ItemFields.PrimaryImageAspectRatio
                ],
                enableImageTypes: [ImageType.Thumb],
                parentId: parentId ?? undefined,
                enableTotalRecordCount: false
            },
            {
                signal: options?.signal
            }
        );
        return response.data.Items;
    }
};

export const useGetStudios = (parentId: ParentId, itemType: BaseItemKind[]) => {
    const currentApi = useApi();
    const isLivetv = parentId === 'livetv';
    return useQuery({
        queryKey: ['Studios', parentId, itemType],
        queryFn: ({ signal }) =>
            fetchGetStudios(currentApi, parentId, itemType, { signal }),
        enabled: !!currentApi.api && !!currentApi.user?.Id && !!parentId && !isLivetv
    });
};
