import { Api } from '@jellyfin/sdk';
import { ArtistApiGetArtistsRequest } from '@jellyfin/sdk/lib/generated-client/api/artist-api';
import { getArtistApi } from '@jellyfin/sdk/lib/utils/api/artist-api';
import { AxiosRequestConfig } from 'axios';
import { QUERY_OPTIONS } from '../constants/queryOptions';

export const fetchArtists = async (
    api: Api,
    userId: string,
    params?: ArtistApiGetArtistsRequest,
    options?: AxiosRequestConfig
) => {
    const response = await getArtistApi(api).getArtists(
        {
            ...QUERY_OPTIONS,
            userId,
            ...params
        },
        options
    );
    return response.data;
};
