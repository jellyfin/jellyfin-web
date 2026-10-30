import { Api } from '@jellyfin/sdk';
import { AxiosRequestConfig } from 'axios';
import { QUERY_OPTIONS } from '../constants/queryOptions';
import { PersonApiGetPersonsRequest } from '@jellyfin/sdk/lib/generated-client/api/person-api';
import { getPersonApi } from '@jellyfin/sdk/lib/utils/api/person-api';

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
            ...params
        },
        options
    );
    return response.data;
};
