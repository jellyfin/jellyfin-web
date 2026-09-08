import { Api } from '@jellyfin/sdk';
import { StudioApiGetStudiosRequest } from '@jellyfin/sdk/lib/generated-client/api/studio-api';
import { getStudioApi } from '@jellyfin/sdk/lib/utils/api/studio-api';
import { AxiosRequestConfig } from 'axios';
import { QUERY_OPTIONS } from '../constants/queryOptions';

export const fetchStudios = async (
    api: Api,
    userId: string,
    params?: StudioApiGetStudiosRequest,
    options?: AxiosRequestConfig
) => {
    const response = await getStudioApi(api).getStudios(
        {
            ...QUERY_OPTIONS,
            userId,
            ...params
        },
        options
    );
    return response.data;
};
