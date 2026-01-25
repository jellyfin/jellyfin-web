import { type Api } from '@jellyfin/sdk';
import { getBrandingApi } from '@jellyfin/sdk/lib/utils/api/branding-api';
import { queryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';

import { useApi } from 'hooks/useApi';

export const QUERY_KEY = 'BrandingOptions';

const fetchBrandingOptions = async (
    api: Api,
    options?: AxiosRequestConfig
) => {
    return getBrandingApi(api)
        .getBrandingOptions(options)
        .then(({ data }) => data);
};

export const getBrandingOptionsQuery = (
    api?: Api
) => queryOptions({
    queryKey: [ QUERY_KEY ],
    queryFn: ({ signal }) => fetchBrandingOptions(api!, { signal }),
    enabled: !!api
});

export const useBrandingOptions = () => {
    const { api } = useApi();
    return useQuery(getBrandingOptionsQuery(api));
};
