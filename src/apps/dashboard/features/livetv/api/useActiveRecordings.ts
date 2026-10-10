import type { Api } from '@jellyfin/sdk';
import type { LiveTvApiGetRecordingsRequest } from '@jellyfin/sdk/lib/generated-client/api/live-tv-api';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import { getLiveTvApi } from '@jellyfin/sdk/lib/utils/api/live-tv-api';
import { useQuery } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';

import { useApi } from 'hooks/useApi';
import { useLiveTvInfo } from './useLiveTvInfo';

export const QUERY_KEY = 'ActiveRecordings';

const fetchActiveRecordings = async (
    api: Api,
    params: LiveTvApiGetRecordingsRequest,
    options?: AxiosRequestConfig
) => {
    const response = await getLiveTvApi(api).getRecordings(params, options);
    return response.data;
};

export const useActiveRecordings = () => {
    const { api, user } = useApi();
    const { data: liveTvInfo } = useLiveTvInfo();
    // IsEnabled is always true because of the built-in Live TV service, so check the enabled users instead
    const isLiveTvEnabled = !!user?.Id && !!liveTvInfo?.EnabledUsers?.includes(user.Id);

    return useQuery({
        queryKey: [ QUERY_KEY ],
        queryFn: ({ signal }) => fetchActiveRecordings(api!, {
            userId: user?.Id,
            isInProgress: true,
            fields: [ ItemFields.CanDelete, ItemFields.PrimaryImageAspectRatio ],
            enableImageTypes: [ ImageType.Primary, ImageType.Thumb, ImageType.Backdrop ],
            enableTotalRecordCount: false
        }, { signal }),
        enabled: !!api && isLiveTvEnabled,
        // The server does not send a timely WebSocket message when a recording starts or ends
        refetchInterval: 30 * 1000
    });
};
