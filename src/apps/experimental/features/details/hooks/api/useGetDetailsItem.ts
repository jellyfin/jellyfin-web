import type { AxiosRequestConfig } from 'axios';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import { getMusicGenresApi } from '@jellyfin/sdk/lib/utils/api/music-genres-api';
import { getLiveTvApi } from '@jellyfin/sdk/lib/utils/api/live-tv-api';
import { getGenresApi } from '@jellyfin/sdk/lib/utils/api/genres-api';
import { getArtistsApi } from '@jellyfin/sdk/lib/utils/api/artists-api';

import { useQuery } from '@tanstack/react-query';

import { type JellyfinApiContext, useApi } from 'hooks/useApi';
import type { ItemDto } from 'types/base/models/item-dto';

const getDetailsItem = async (
    currentApi: JellyfinApiContext,
    urlParams: UrlParams,
    options?: AxiosRequestConfig
): Promise<ItemDto | undefined> => {
    const { api, user } = currentApi;
    if (!api) throw new Error('No API instance available');
    if (!user?.Id) throw new Error('No User ID provided');

    if (urlParams.id) {
        const response = await getUserLibraryApi(api).getItem(
            {
                userId: user.Id,
                itemId: urlParams.id
            },
            options
        );
        return response.data;
    }

    if (urlParams.seriesTimerId) {
        const response = await getLiveTvApi(api).getSeriesTimer(
            {
                timerId: urlParams.seriesTimerId
            },
            options
        );
        return response.data;
    }

    if (urlParams.genre) {
        const response = await getGenresApi(api).getGenre(
            {
                genreName: urlParams.genre,
                userId: user.Id
            },
            options
        );
        return response.data;
    }

    if (urlParams.musicgenre) {
        const response = await getMusicGenresApi(api).getMusicGenre(
            {
                genreName: urlParams.musicgenre,
                userId: user.Id
            },
            options
        );
        return response.data;
    }

    if (urlParams.musicartist) {
        const response = await getArtistsApi(api).getArtistByName(
            {
                name: urlParams.musicartist,
                userId: user.Id
            },
            options
        );
        return response.data;
    }
};

interface UrlParams {
    id?: string | null;
    seriesTimerId?: string | null;
    genre?: string | null;
    musicgenre?: string | null;
    musicartist?: string | null;
}

interface UseGetDetailsItemProps {
    urlParams: UrlParams;
}

export const useGetDetailsItem = ({ urlParams }: UseGetDetailsItemProps) => {
    const currentApi = useApi();
    return useQuery({
        queryKey: ['DetailsItem', { urlParams }],
        queryFn: ({ signal }) =>
            getDetailsItem(currentApi, urlParams, { signal }),
        enabled: !!currentApi.api && !!currentApi.user?.Id
    });
};
