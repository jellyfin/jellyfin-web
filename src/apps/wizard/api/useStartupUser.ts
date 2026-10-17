import { Api } from '@jellyfin/sdk';
import { getStartupApi } from '@jellyfin/sdk/lib/utils/api/startup-api';
import { useQuery } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';
import type { AxiosRequestConfig } from 'axios';

export const QUERY_KEY = 'StartupUser';

export const fetchStartupUser = async (api: Api, options?: AxiosRequestConfig) => {
    const response = await getStartupApi(api).getFirstUser(options);

    return response.data;
};

export const useStartupUser = () => {
    const { api } = useApi();

    return useQuery({
        queryKey: [ QUERY_KEY ],
        queryFn: ({ signal }) => fetchStartupUser(api!, { signal }),
        enabled: !!api
    });
};
