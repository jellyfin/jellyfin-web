import React, { FC, useCallback } from 'react';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { IconButton } from '@mui/material';
import classNames from 'classnames';
import { useToggleFavoriteMutation } from 'hooks/useFetchItems';
import globalize from 'scripts/globalize';

interface FavoriteButtonProps {
    className?: string;
    isFavorite: boolean | undefined;
    itemId: string | null | undefined
}

const FavoriteButton: FC<FavoriteButtonProps> = ({
    className,
    isFavorite = false,
    itemId
}) => {
    const { mutateAsync: toggleFavoriteMutation } = useToggleFavoriteMutation();
    const [favoriteState, setFavoriteState] = React.useState<boolean>(isFavorite);

    const onClick = useCallback(async () => {
        try {
            if (!itemId) {
                throw new Error('Item has no Id');
            }

            const _isFavorite = await toggleFavoriteMutation({
                itemId,
                favoriteState
            });
            setFavoriteState(!!_isFavorite);
        } catch (e) {
            console.error(e);
        }
    }, [favoriteState, itemId, toggleFavoriteMutation]);

    const btnClass = classNames(
        className,
        { 'ratingbutton-withrating': favoriteState }
    );

    const iconClass = classNames(
        { 'ratingbutton-icon-withrating': favoriteState }
    );

    return (
        <IconButton
            title={favoriteState ? globalize.translate('Favorite') : globalize.translate('AddToFavorites')}
            className={btnClass}
            size='small'
            onClick={onClick}
        >
            <FavoriteIcon className={iconClass} />
        </IconButton>
    );
};

export default FavoriteButton;
