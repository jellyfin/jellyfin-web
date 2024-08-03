import { getPlaystateApi } from '@jellyfin/sdk/lib/utils/api/playstate-api';
import { useMutation } from '@tanstack/react-query';
import { JellyfinApiContext, useApi } from 'hooks/useApi';

interface TogglePlayedMutationProp {
    itemId: string;
    isPlayed: boolean;
}

const fetchUpdatePlayedState = async (
    currentApi: JellyfinApiContext,
    itemId: string,
    isPlayed: boolean
) => {
    const { api, user } = currentApi;
    if (api && user?.Id) {
        if (isPlayed) {
            const response = await getPlaystateApi(api).markUnplayedItem({
                userId: user.Id,
                itemId: itemId
            });
            return response.data.Played;
        } else {
            const response = await getPlaystateApi(api).markPlayedItem({
                userId: user.Id,
                itemId: itemId
            });
            return response.data.Played;
        }
    }
};

export const useTogglePlayedMutation = () => {
    const currentApi = useApi();
    return useMutation({
        mutationFn: ({ itemId, isPlayed }: TogglePlayedMutationProp) =>
            fetchUpdatePlayedState(currentApi, itemId, isPlayed)
    });
};
