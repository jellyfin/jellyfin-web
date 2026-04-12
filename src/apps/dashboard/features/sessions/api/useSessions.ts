import type { SessionApiGetSessionsRequest } from '@jellyfin/sdk/lib/generated-client/api/session-api';
import type { AxiosRequestConfig } from 'axios';
import type { Api } from '@jellyfin/sdk';
import { getSessionApi } from '@jellyfin/sdk/lib/utils/api/session-api';
import { useQuery } from '@tanstack/react-query';

import { useApi } from 'hooks/useApi';

export const QUERY_KEY = 'Sessions';

const fetchSessions = async (
    api: Api,
    requestParams?: SessionApiGetSessionsRequest,
    options?: AxiosRequestConfig
) => {
    const response = await getSessionApi(api).getSessions(requestParams, {
        signal: options?.signal
    });

    return response.data;
};

export const useSessions = (
    requestParams: SessionApiGetSessionsRequest
) => {
    const { api } = useApi();
    return useQuery({
        queryKey: [QUERY_KEY, requestParams],
        queryFn: ({ signal }) =>
            fetchSessions(api!, requestParams, { signal }),
        enabled: !!api,
        refetchOnWindowFocus: false
    });
};
