import React, { type FC, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { IconButton } from 'ui-primitives';
import { HeartFilledIcon, HeartIcon } from '@radix-ui/react-icons';
import { deprecate } from '../../utils/deprecation';

import { ItemAction } from 'constants/itemAction';
import { useToggleFavoriteMutation } from 'hooks/useFetchItems';
import globalize from 'lib/globalize';

interface FavoriteButtonProps {
    className?: string;
    isFavorite: boolean | undefined;
    itemId: string | null | undefined;
    queryKey?: string[];
}

const FavoriteButton: FC<FavoriteButtonProps> = ({ className, isFavorite = false, itemId, queryKey }) => {
    deprecate(
        'emby-ratingbutton/FavoriteButton',
        'Direct ui-primitives/IconButton usage with custom favorite logic',
        'src/elements/emby-ratingbutton/FavoriteButton.tsx'
    );

    const queryClient = useQueryClient();
    const { mutateAsync: toggleFavoriteMutation } = useToggleFavoriteMutation();

    const onClick = useCallback(
        async (e: React.MouseEvent) => {
            e.stopPropagation();
            try {
                if (!itemId) {
                    throw new Error('Item has no Id');
                }

                await toggleFavoriteMutation(
                    {
                        itemId,
                        isFavorite
                    },
                    {
                        onSuccess: async () => {
                            await queryClient.invalidateQueries({
                                queryKey,
                                type: 'all',
                                refetchType: 'active'
                            });
                        }
                    }
                );
            } catch (e) {
                console.error(e);
            }
        },
        [isFavorite, itemId, queryClient, queryKey, toggleFavoriteMutation]
    );

    return (
        <IconButton
            data-action={ItemAction.None}
            className={className}
            title={isFavorite ? globalize.translate('Favorite') : globalize.translate('AddToFavorites')}
            variant="plain"
            color={isFavorite ? 'danger' : 'neutral'}
            size="sm"
            onClick={onClick}
        >
            {isFavorite ? <HeartFilledIcon /> : <HeartIcon />}
        </IconButton>
    );
};

export default FavoriteButton;
