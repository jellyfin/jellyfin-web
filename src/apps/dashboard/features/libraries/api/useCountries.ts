import { type Api } from '@jellyfin/sdk';
import { getLocalizationApi } from '@jellyfin/sdk/lib/utils/api/localization-api';
import { useQuery } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';
import type { AxiosRequestConfig } from 'axios';

const fetchCountries = async (api: Api, options?: AxiosRequestConfig) => {
    const response = await getLocalizationApi(api).getCountries(options);

    return response.data;
};

export const useCountries = () => {
    const { api } = useApi();

    return useQuery({
        queryKey: [ 'Countries' ],
        queryFn: ({ signal }) => fetchCountries(api!, { signal }),
        enabled: !!api
    });
};
