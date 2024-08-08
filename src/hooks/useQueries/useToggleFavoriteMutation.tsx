import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import { useMutation } from '@tanstack/react-query';
import { JellyfinApiContext, useApi } from 'hooks/useApi';

interface ToggleFavoriteMutationProp {
    itemId: string;
    isFavorite: boolean;
}

const fetchUpdateFavoriteStatus = async (
    currentApi: JellyfinApiContext,
    itemId: string,
    isFavorite: boolean
) => {
    const { api, user } = currentApi;
    if (api && user?.Id) {
        if (isFavorite) {
            const response = await getUserLibraryApi(api).unmarkFavoriteItem({
                userId: user.Id,
                itemId: itemId
            });
            return response.data.IsFavorite;
        } else {
            const response = await getUserLibraryApi(api).markFavoriteItem({
                userId: user.Id,
                itemId: itemId
            });
            return response.data.IsFavorite;
        }
    }
};

export const useToggleFavoriteMutation = () => {
    const currentApi = useApi();
    return useMutation({
        mutationFn: ({ itemId, isFavorite }: ToggleFavoriteMutationProp) =>
            fetchUpdateFavoriteStatus(currentApi, itemId, isFavorite)
    });
};
