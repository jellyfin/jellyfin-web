import type { AxiosRequestConfig } from 'axios';
import type { ParentalRating } from '@jellyfin/sdk/lib/generated-client/models/parental-rating';
import { getLocalizationApi } from '@jellyfin/sdk/lib/utils/api/localization-api';
import { useQuery } from '@tanstack/react-query';
import { type JellyfinApiContext, useApi } from 'hooks/useApi';

const fetchGetParentalRatings = async (
    currentApi: JellyfinApiContext,
    options?: AxiosRequestConfig
) => {
    const { api } = currentApi;
    if (api) {
        const response = await getLocalizationApi(api).getParentalRatings({
            signal: options?.signal
        });
        return response.data;
    }
};

export const useGetParentalRatings = () => {
    const currentApi = useApi();
    return useQuery({
        queryKey: ['ParentalRatings'],
        queryFn: ({ signal }) =>
            fetchGetParentalRatings(currentApi, { signal }),
        select: (data) => {
            let rating;
            const ratings: ParentalRating[] = [];

            for (const parentalRating of data || []) {
                rating = parentalRating;
                if (ratings.length) {
                    const lastRating = ratings[ratings.length - 1];

                    if (lastRating.Value === rating.Value) {
                        lastRating.Name += '/' + rating.Name;
                        continue;
                    }
                }

                ratings.push({
                    Name: rating.Name,
                    Value: rating.Value
                });
            }
            return ratings;
        }
    });
};
