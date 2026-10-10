import { useQuery } from '@tanstack/react-query';

import { useApi } from 'hooks/useApi';
import { getLiveTvApi } from '@jellyfin/sdk/lib/utils/api/live-tv-api';

export const useTunerHostTypes = () => {
    const { api } = useApi();

    return useQuery({
        queryKey: [ 'TunerHostTypes' ],
        queryFn: async () => (await getLiveTvApi(api!).getTunerHostTypes()).data,
        enabled: !!api
    });
};
