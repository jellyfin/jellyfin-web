import { PlaylistsApiMoveItemRequest } from '@jellyfin/sdk/lib/generated-client';
import { getPlaylistsApi } from '@jellyfin/sdk/lib/utils/api/playlists-api';
import { useMutation } from '@tanstack/react-query';
import { JellyfinApiContext, useApi } from 'hooks/useApi';

const fetchPlaylistsMoveItem = async (
    currentApi: JellyfinApiContext,
    requestParameters: PlaylistsApiMoveItemRequest
) => {
    const { api, user } = currentApi;
    if (api && user?.Id) {
        const response = await getPlaylistsApi(api).moveItem({
            ...requestParameters
        });
        return response.data;
    }
};

export const usePlaylistsMoveItemMutation = () => {
    const currentApi = useApi();
    return useMutation({
        mutationFn: (requestParameters: PlaylistsApiMoveItemRequest) =>
            fetchPlaylistsMoveItem(currentApi, requestParameters)
    });
};
