import type { Api } from '@jellyfin/sdk/lib/api';
import type { ShowApiGetUpcomingEpisodesRequest } from '@jellyfin/sdk/lib/generated-client/api/show-api';
import { getShowApi } from '@jellyfin/sdk/lib/utils/api/show-api';
import { infiniteQueryOptions, useInfiniteQuery } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';

import { useApi } from 'hooks/useApi';

export const UPCOMING_EPISODES_PAGE_SIZE = 25;

const fetchUpcomingEpisodes = async (
    api: Api,
    params: ShowApiGetUpcomingEpisodesRequest,
    options?: AxiosRequestConfig
) => {
    const response = await getShowApi(api).getUpcomingEpisodes(params, options);
    return response.data;
};

/** Query options for fetching upcoming episodes. */
export const getUpcomingEpisodesQuery = (
    api?: Api,
    params: ShowApiGetUpcomingEpisodesRequest = {},
    enabled = true
) => infiniteQueryOptions({
    queryKey: ['UpcomingEpisodes', params?.parentId],
    queryFn: ({ pageParam, signal }) => fetchUpcomingEpisodes(
        api!,
        { ...params, startIndex: pageParam, limit: UPCOMING_EPISODES_PAGE_SIZE },
        { signal }
    ),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
        // The Upcoming endpoint does not report a reliable total record
        // count, so detect the end of the list by a short final page.
        if ((lastPage?.Items?.length ?? 0) < UPCOMING_EPISODES_PAGE_SIZE) {
            return undefined;
        }

        return allPages.length * UPCOMING_EPISODES_PAGE_SIZE;
    },
    enabled: !!api && !!params?.userId && enabled
});

/** Hook for fetching upcoming episodes. */
export const useUpcomingEpisodes = (
    params?: ShowApiGetUpcomingEpisodesRequest,
    enabled?: boolean
) => {
    const { api, user } = useApi();
    return useInfiniteQuery(getUpcomingEpisodesQuery(
        api,
        {
            ...params,
            userId: params?.userId || user?.Id
        },
        enabled
    ));
};
