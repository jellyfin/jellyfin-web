import type { AxiosRequestConfig } from 'axios';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import { getLiveTvApi } from '@jellyfin/sdk/lib/utils/api/live-tv-api';

import { useQuery } from '@tanstack/react-query';

import { type JellyfinApiContext, useApi } from 'hooks/useApi';
import type { ItemDto } from 'types/base/models/item-dto';

const getDetailsItem = async (
    apiContext: JellyfinApiContext,
    urlParams: UrlParams,
    options?: AxiosRequestConfig
): Promise<ItemDto | undefined> => {
    const { api, user } = apiContext;
    if (!api) throw new Error('[getDetailsItem] No API instance available');
    if (!user?.Id) throw new Error('[getDetailsItem] No User ID provided');

    if (urlParams.id) {
        const response = await getUserLibraryApi(api).getItem(
            {
                userId: user.Id,
                itemId: urlParams.id
            },
            options
        );
        return response.data as ItemDto;
    }

    if (urlParams.seriesTimerId) {
        const response = await getLiveTvApi(api).getSeriesTimer(
            {
                timerId: urlParams.seriesTimerId
            },
            options
        );
        return response.data as ItemDto;
    }
};

interface UrlParams {
    id?: string | null;
    seriesTimerId?: string | null;
}

interface UseGetDetailsItemProps {
    urlParams: UrlParams;
}

export const useGetDetailsItem = ({ urlParams }: UseGetDetailsItemProps) => {
    const apiContext = useApi();
    return useQuery({
        queryKey: ['DetailsItem', { urlParams }],
        queryFn: ({ signal }) =>
            getDetailsItem(apiContext, urlParams, { signal }),
        enabled: !!apiContext.api && !!apiContext.user?.Id
    });
};
