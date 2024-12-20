import { Api } from '@jellyfin/sdk';
import { getLocalizationApi } from '@jellyfin/sdk/lib/utils/api/localization-api';
import { useQuery } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';

const fetchParentalRatings = async (api?: Api) => {
    if (!api) {
        console.error('[useLibraryMediaFolders] no Api instance available');
        return;
    }

    const response = await getLocalizationApi(api).getParentalRatings();

    return response.data;
};

export const useParentalRatings = () => {
    const { api } = useApi();

    return useQuery({
        queryKey: ['ParentalRatings'],
        queryFn: () => fetchParentalRatings(api),
        enabled: !!api
    });
};
