import type { AxiosRequestConfig } from 'axios';
import type { ParentalRating } from '@jellyfin/sdk/lib/generated-client/models/parental-rating';
import { getLocalizationApi } from '@jellyfin/sdk/lib/utils/api/localization-api';
import { useQuery } from '@tanstack/react-query';
import { type JellyfinApiContext, useApi } from 'hooks/useApi';

function groupRating(data: ParentalRating[]) {
    const ratings: ParentalRating[] = [];

    for (const parentalRating of data) {
        const rating: ParentalRating = {
            Name: parentalRating.Name,
            Value:
                parentalRating.Value !== undefined ?
                    parentalRating.Value :
                    null
        };

        const existingRating = ratings.find((r) => r.Value === rating.Value);
        if (existingRating) {
            existingRating.Name += '/' + rating.Name;
        } else {
            ratings.push(rating);
        }
    }

    return ratings;
}

const getParentalRatings = async (
    currentApi: JellyfinApiContext,
    options?: AxiosRequestConfig
) => {
    const { api } = currentApi;
    if (api) {
        const response = await getLocalizationApi(api).getParentalRatings(
            options
        );

        return groupRating(response.data || []);
    }
};

export const useGetParentalRatings = () => {
    const currentApi = useApi();
    return useQuery({
        queryKey: ['ParentalRatings'],
        queryFn: ({ signal }) => getParentalRatings(currentApi, { signal })
    });
};
