import type { AxiosRequestConfig } from 'axios';
import type { Api } from '@jellyfin/sdk';
import type { LiveTvApiGetRecordingFoldersRequest } from '@jellyfin/sdk/lib/generated-client';
import { getLiveTvApi } from '@jellyfin/sdk/lib/utils/api/live-tv-api';
import { useQuery } from '@tanstack/react-query';

import { useApi } from './useApi';

const fetchRecordingFolders = async (
    api?: Api,
    requestParams?: LiveTvApiGetRecordingFoldersRequest,
    options?: AxiosRequestConfig
) => {
    if (!api) {
        console.warn('[fetchRecordingFolders] No API instance available');
        return;
    }

    const response = await getLiveTvApi(api).getRecordingFolders(requestParams, {
        signal: options?.signal
    });

    return response.data;
};

export const useRecordingFolders = (requestParams?: LiveTvApiGetRecordingFoldersRequest) => {
    const { api } = useApi();
    return useQuery({
        queryKey: ['LiveTv', 'RecordingFolders', requestParams],
        queryFn: ({ signal }) =>
            fetchRecordingFolders(api, requestParams, { signal }),
        enabled: !!api
    });
};
