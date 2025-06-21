import type { AxiosRequestConfig } from 'axios';
import type { TvShowsApiGetNextUpRequest } from '@jellyfin/sdk/lib/generated-client';
import { getTvShowsApi } from '@jellyfin/sdk/lib/utils/api/tv-shows-api';
import { queryOptions, useQuery } from '@tanstack/react-query';
import { type JellyfinApiContext, useApi } from 'hooks/useApi';
import type { ItemDtoQueryResult } from 'types/base/models/item-dto-query-result';

const getNextUp = async (
    apiContext: JellyfinApiContext,
    params?: TvShowsApiGetNextUpRequest,
    options?: AxiosRequestConfig
) => {
    const { api } = apiContext;
    if (!api) throw new Error('No API instance available');

    const response = await getTvShowsApi(api).getNextUp(params, options);

    return response.data as ItemDtoQueryResult;
};

export const getNextUpQuery = (
    apiContext: JellyfinApiContext,
    params?: TvShowsApiGetNextUpRequest
) =>
    queryOptions({
        queryKey: ['NextUp', params],
        queryFn: ({ signal }) => getNextUp(apiContext, params, { signal }),
        enabled: !!apiContext.api
    });

export const useGetNextUp = (params?: TvShowsApiGetNextUpRequest) => {
    const apiContext = useApi();
    return useQuery(getNextUpQuery(apiContext, params));
};
