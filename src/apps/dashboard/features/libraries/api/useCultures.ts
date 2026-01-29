import { type Api } from '@jellyfin/sdk';
import { getLocalizationApi } from '@jellyfin/sdk/lib/utils/api/localization-api';
import { useQuery } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';
import { useApi } from 'hooks/useApi';

const fetchCultures = async (api: Api, options?: AxiosRequestConfig) => {
    const response = await getLocalizationApi(api).getCultures(options);

    return response.data;
};

export const useCultures = () => {
    const { api } = useApi();

    return useQuery({
        queryKey: ['Cultures'],
        queryFn: ({ signal }) => fetchCultures(api!, { signal }),
        enabled: !!api
    });
};
