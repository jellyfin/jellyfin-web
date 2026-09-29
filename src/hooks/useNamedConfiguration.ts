import { Api } from '@jellyfin/sdk';
import { getSystemApi } from '@jellyfin/sdk/lib/utils/api/system-api';
import { useQuery } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';
import type { AxiosRequestConfig } from 'axios';

export const QUERY_KEY = 'NamedConfiguration';

export interface NamedConfiguration {
    [key: string]: unknown;
}

const fetchNamedConfiguration = async (api: Api, key: string, options?: AxiosRequestConfig) => {
    const response = await getSystemApi(api).getNamedConfiguration({ key }, options);

    return response.data;
};

export const useNamedConfiguration = <ConfigType = NamedConfiguration>(key: string) => {
    const { api } = useApi();

    return useQuery({
        queryKey: [ QUERY_KEY, key ],
        queryFn: ({ signal }) => fetchNamedConfiguration(api!, key, { signal }) as ConfigType,
        enabled: !!api
    });
};
