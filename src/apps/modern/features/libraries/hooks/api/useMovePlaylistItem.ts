import type { PlaylistApiMoveItemRequest } from '@jellyfin/sdk/lib/generated-client/api/playlist-api';
import { getPlaylistApi } from '@jellyfin/sdk/lib/utils/api/playlist-api';
import { useMutation } from '@tanstack/react-query';

import { type JellyfinApiContext, useApi } from 'hooks/useApi';

const fetchPlaylistsMoveItem = async (
    currentApi: JellyfinApiContext,
    requestParameters: PlaylistApiMoveItemRequest
) => {
    const { api, user } = currentApi;
    if (api && user?.Id) {
        const response = await getPlaylistApi(api).moveItem({
            ...requestParameters
        });
        return response.data;
    }
};

export const usePlaylistsMoveItemMutation = () => {
    const currentApi = useApi();
    return useMutation({
        mutationFn: (requestParameters: PlaylistApiMoveItemRequest) =>
            fetchPlaylistsMoveItem(currentApi, requestParameters )
    });
};
