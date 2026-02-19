import { Api } from '@jellyfin/sdk';
import { getSystemApi } from '@jellyfin/sdk/lib/utils/api/system-api';
import { useQuery } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';
import type { AxiosRequestConfig } from 'axios';

const fetchServerLog = async (
    api: Api,
    name: string,
    options?: AxiosRequestConfig
) => {
    const response = await getSystemApi(api).getLogFile({ name }, options);

    // FIXME: TypeScript SDK thinks it is returning a File but in reality it is a string
    const data = response.data as never as string | object;

    if (typeof data === 'object') {
        return JSON.stringify(data, null, 2);
    } else {
        return data;
    }
};
export const useServerLog = (name: string) => {
    const { api } = useApi();

    return useQuery({
        queryKey: ['ServerLog', name],
        queryFn: ({ signal }) => fetchServerLog(api!, name, { signal }),
        enabled: !!api
    });
};
