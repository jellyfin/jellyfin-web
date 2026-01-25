import type { AxiosRequestConfig } from 'axios';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import { getLiveTvApi } from '@jellyfin/sdk/lib/utils/api/live-tv-api';
import { useQuery } from '@tanstack/react-query';
import { type JellyfinApiContext, useApi } from 'hooks/useApi';
import type { ItemDto } from 'types/base/models/item-dto';
import { ItemKind } from 'types/base/models/item-kind';

const getItemByType = async (
    apiContext: JellyfinApiContext,
    itemType: ItemKind,
    itemId: string,
    options?: AxiosRequestConfig
) => {
    const { api, user } = apiContext;

    if (!api) throw new Error('[getItemByType] No API instance available');
    if (!user?.Id) throw new Error('[getItemByType] No User ID provided');

    let response;
    switch (itemType) {
        case ItemKind.Timer: {
            response = await getLiveTvApi(api).getTimer({ timerId: itemId }, options);
            break;
        }
        case ItemKind.SeriesTimer:
            response = await getLiveTvApi(api).getSeriesTimer({ timerId: itemId }, options);
            break;
        default: {
            response = await getUserLibraryApi(api).getItem({ userId: user.Id, itemId }, options);
            break;
        }
    }
    return response.data as ItemDto;
};

interface UseGetItemByTypeProps {
    itemType: ItemKind;
    itemId: string;
}

export const useGetItemByType = ({ itemType, itemId }: UseGetItemByTypeProps) => {
    const apiContext = useApi();
    return useQuery({
        queryKey: ['ItemByType', { itemType, itemId }],
        queryFn: ({ signal }) => getItemByType(apiContext, itemType, itemId, { signal }),
        enabled: !!apiContext.api && !!apiContext.user?.Id && !!itemId
    });
};
