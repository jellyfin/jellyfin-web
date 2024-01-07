import React, { FC, useCallback } from 'react';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { IconButton } from '@mui/material';
import classNames from 'classnames';
import { useToggleFavoriteMutation } from 'hooks/useFetchItems';
import globalize from 'scripts/globalize';

interface FavoriteButtonProps {
    className?: string;
    favoriteState: boolean | undefined;
    itemId: string | null | undefined
}

const FavoriteButton: FC<FavoriteButtonProps> = ({
    className,
    favoriteState,
    itemId
}) => {
    const { mutateAsync: toggleFavoriteMutation } = useToggleFavoriteMutation();
    const [isFavorite, setIsFavorite] = React.useState<boolean | undefined>(favoriteState ?? false);

    const onClick = useCallback(async () => {
        try {
            if (!itemId) {
                throw new Error('Item has no Id');
            }

            const response = await toggleFavoriteMutation({
                itemId,
                isFavorite
            });
            setIsFavorite(response?.IsFavorite);
        } catch (e) {
            console.error(e);
        }
    }, [isFavorite, itemId, toggleFavoriteMutation]);

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
