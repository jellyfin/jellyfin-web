import { getUserDataApi } from '@jellyfin/sdk/lib/utils/api/user-data-api';
import { useMutation } from '@tanstack/react-query';

import { type JellyfinApiContext, useApi } from 'hooks/useApi';

interface TogglePlayedMutationProp {
    itemId: string;
    isPlayed: boolean
}

const fetchUpdatePlayedState = async (
    currentApi: JellyfinApiContext,
    itemId: string,
    isPlayed: boolean
) => {
    const { api, user } = currentApi;
    if (api && user?.Id) {
        if (isPlayed) {
            const response = await getUserDataApi(api).markUnplayedItem({
                userId: user.Id,
                itemId
            });
            return response.data.Played;
        } else {
            const response = await getUserDataApi(api).markPlayedItem({
                userId: user.Id,
                itemId
            });
            return response.data.Played;
        }
    }
};

export const useTogglePlayedMutation = () => {
    const currentApi = useApi();
    return useMutation({
        mutationFn: ({ itemId, isPlayed }: TogglePlayedMutationProp) =>
            fetchUpdatePlayedState(currentApi, itemId, isPlayed )
    });
};
