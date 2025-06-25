import { type FC, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import IconButton from '@mui/material/IconButton';
import FavoriteIcon from '@mui/icons-material/Favorite';

import classNames from 'classnames';
import { useToggleFavoriteMutation } from 'hooks/useFetchItems';
import globalize from 'lib/globalize';

interface FavoriteButtonProps {
    className?: string;
    isFavorite: boolean | undefined;
    itemId: string | null | undefined;
    queryKey?: string[]
}

const FavoriteButton: FC<FavoriteButtonProps> = ({
    className,
    isFavorite = false,
    itemId,
    queryKey
}) => {
    const queryClient = useQueryClient();
    const { mutateAsync: toggleFavoriteMutation } = useToggleFavoriteMutation();

    const onClick = useCallback(async () => {
        try {
            if (!itemId) {
                throw new Error('Item has no Id');
            }

            await toggleFavoriteMutation({
                itemId,
                isFavorite
            },
            { onSuccess: async() => {
                await queryClient.invalidateQueries({
                    queryKey,
                    type: 'all',
                    refetchType: 'active'
                });
            } });
        } catch (e) {
            console.error(e);
        }
    }, [isFavorite, itemId, queryClient, queryKey, toggleFavoriteMutation]);

    const btnClass = classNames(
        className,
        { 'ratingbutton-withrating': isFavorite }
    );

    const iconClass = classNames(
        { 'ratingbutton-icon-withrating': isFavorite }
    );

    return (
        <IconButton
            title={isFavorite ? globalize.translate('Favorite') : globalize.translate('AddToFavorites')}
            className={btnClass}
            size='small'
            onClick={onClick}
        >
            <FavoriteIcon className={iconClass} />
        </IconButton>
    );
};

export default FavoriteButton;
