import type { AxiosRequestConfig } from 'axios';
import { ItemFields } from '@jellyfin/sdk/lib/generated-client';
import { getMoviesApi } from '@jellyfin/sdk/lib/utils/api/movies-api';
import { useQuery } from '@tanstack/react-query';
import { JellyfinApiContext, useApi } from 'hooks/useApi';
import { ParentId } from 'types/library';

const fetchGetMovieRecommendations = async (
    currentApi: JellyfinApiContext,
    parentId: ParentId,
    options?: AxiosRequestConfig
) => {
    const { api, user } = currentApi;
    if (api && user?.Id) {
        const response = await getMoviesApi(api).getMovieRecommendations(
            {
                userId: user.Id,
                fields: [
                    ItemFields.PrimaryImageAspectRatio,
                    ItemFields.MediaSourceCount
                ],
                parentId: parentId ?? undefined,
                categoryLimit: 6,
                itemLimit: 20
            },
            {
                signal: options?.signal
            }
        );
        return response.data;
    }
};

export const useGetMovieRecommendations = (
    isMovieRecommendationEnabled: boolean,
    parentId: ParentId
) => {
    const currentApi = useApi();
    return useQuery({
        queryKey: [
            'MovieRecommendations',
            isMovieRecommendationEnabled,
            parentId
        ],
        queryFn: ({ signal }) =>
            isMovieRecommendationEnabled ?
                fetchGetMovieRecommendations(currentApi, parentId, { signal }) :
                []
    });
};
