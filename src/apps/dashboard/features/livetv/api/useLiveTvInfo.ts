import type { Api } from '@jellyfin/sdk';
import { getLiveTvApi } from '@jellyfin/sdk/lib/utils/api/live-tv-api';
import { useQuery } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';

import { useApi } from 'hooks/useApi';

const fetchLiveTvInfo = async (
    api: Api,
    options?: AxiosRequestConfig
) => {
    const response = await getLiveTvApi(api).getLiveTvInfo(options);
    return response.data;
};

export const useLiveTvInfo = () => {
    const { api } = useApi();
    return useQuery({
        queryKey: [ 'LiveTvInfo' ],
        queryFn: ({ signal }) => fetchLiveTvInfo(api!, { signal }),
        enabled: !!api
    });
};
