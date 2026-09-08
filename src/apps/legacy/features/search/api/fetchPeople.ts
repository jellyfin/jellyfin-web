import { Api } from '@jellyfin/sdk';
import { AxiosRequestConfig } from 'axios';
import { QUERY_OPTIONS } from '../constants/queryOptions';
import { PersonApiGetPersonsRequest } from '@jellyfin/sdk/lib/generated-client/api/person-api';
import { getPersonApi } from '@jellyfin/sdk/lib/utils/api/person-api';
import { PersonKind } from '@jellyfin/sdk/lib/generated-client/models/person-kind';

export const fetchPeople = async (
    api: Api,
    userId: string,
    params?: PersonApiGetPersonsRequest,
    options?: AxiosRequestConfig
) => {
    const response = await getPersonApi(api).getPersons(
        {
            ...QUERY_OPTIONS,
            userId,
            // TODO remove this exclusion when artists are migrated to the persons endpoint
            excludePersonTypes: [
                PersonKind.Artist,
                PersonKind.AlbumArtist
            ],
            ...params
        },
        options
    );
    return response.data;
};
