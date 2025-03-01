import { useApi } from 'hooks/useApi';
import { queryOptions, useQuery } from '@tanstack/react-query';
import { Api } from '@jellyfin/sdk/lib/api';
import { AxiosRequestConfig } from 'axios';
import { getConfigurationApi } from '@jellyfin/sdk/lib/utils/api/configuration-api';

export const QUERY_KEY = 'MetadataConfiguration';

type MetadataConfiguration = {
    UseFileCreationTimeForDateAdded: boolean;
};

const fetchMetadataConfiguration = async(
    api?: Api,
    options?: AxiosRequestConfig
) => {
    if (!api) {
        console.error('[fetchMetadataConfiguration] no Api instance provided');
        throw new Error('No Api instance provided to fetchMetadataConfiguration');
    }

    return getConfigurationApi(api)
        .getNamedConfiguration({ key: 'metadata' }, options)
        .then(( { data }) => data as unknown as MetadataConfiguration);
};

export const getMetadataConfigurationQuery = (
    api?: Api
) => queryOptions({
    queryKey: [ QUERY_KEY ],
    queryFn: ({ signal }) => fetchMetadataConfiguration(api, { signal }),
    enabled: !!api
});

export const useMetadataConfiguration = () => {
    const { api } = useApi();
    return useQuery(getMetadataConfigurationQuery(api));
};
