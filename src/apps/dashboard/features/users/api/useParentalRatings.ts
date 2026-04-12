import { Api } from '@jellyfin/sdk';
import { getLocalizationApi } from '@jellyfin/sdk/lib/utils/api/localization-api';
import { useQuery } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';
import type { AxiosRequestConfig } from 'axios';

const fetchParentalRatings = async (api: Api, options?: AxiosRequestConfig) => {
    const response = await getLocalizationApi(api).getParentalRatings(options);

    return response.data;
};

export const useParentalRatings = () => {
    const { api } = useApi();

    return useQuery({
        queryKey: ['ParentalRatings'],
        queryFn: ({ signal }) => fetchParentalRatings(api!, { signal }),
        enabled: !!api
    });
};
