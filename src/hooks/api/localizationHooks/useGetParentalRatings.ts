import type { AxiosRequestConfig } from 'axios';
import { getLocalizationApi } from '@jellyfin/sdk/lib/utils/api/localization-api';
import { queryOptions, useQuery } from '@tanstack/react-query';
import { type JellyfinApiContext, useApi } from 'hooks/useApi';

const getParentalRatings = async (
    apiContext: JellyfinApiContext,
    options?: AxiosRequestConfig
) => {
    const { api } = apiContext;

    if (!api) throw new Error('[getParentalRatings] No API instance available');

    const response = await getLocalizationApi(api).getParentalRatings(options);
    return response.data || [];
};

export const getParentalRatingsQuery = (apiContext: JellyfinApiContext) =>
    queryOptions({
        queryKey: ['ParentalRatings'],
        queryFn: ({ signal }) => getParentalRatings(apiContext, { signal }),
        enabled: !!apiContext.api
    });

export const useGetParentalRatings = () => {
    const apiContext = useApi();
    return useQuery(getParentalRatingsQuery(apiContext));
};
