import { Api } from '@jellyfin/sdk';
import { getLocalizationApi } from '@jellyfin/sdk/lib/utils/api/localization-api';
import { useQuery } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';
import type { AxiosRequestConfig } from 'axios';

const fetchLocalizationOptions = async (api: Api, options?: AxiosRequestConfig) => {
    const response = await getLocalizationApi(api).getLocalizationOptions(options);

    return response.data;
};

export const useLocalizationOptions = () => {
    const { api } = useApi();

    return useQuery({
        queryKey: [ 'LocalizationOptions' ],
        queryFn: ({ signal }) => fetchLocalizationOptions(api!, { signal }),
        enabled: !!api
    });
};
