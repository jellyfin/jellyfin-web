import React, { type FC, useCallback, useState } from 'react';
import { type QueryKey, useQueryClient } from '@tanstack/react-query';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';

import { ItemAction } from 'constants/itemAction';
import { useUpdateUserRatingMutation } from 'hooks/useFetchItems';
import globalize from 'lib/globalize';

/** The server stores a 0-10 double; the picker offers whole numbers 1-10. */
const RATING_VALUES = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

interface UserRatingButtonProps {
    className?: string;
    rating: number | null | undefined;
    itemId: string | null | undefined;
    queryKey?: QueryKey
}

const UserRatingButton: FC<UserRatingButtonProps> = ({
    className,
    rating,
    itemId,
    queryKey
}) => {
    const queryClient = useQueryClient();
    const { mutateAsync: updateUserRatingMutation } = useUpdateUserRatingMutation();
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    const onOpen = useCallback((e: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(e.currentTarget);
    }, []);

    const onClose = useCallback(() => {
        setAnchorEl(null);
    }, []);

    const setRating = useCallback(async (value: number | null) => {
        setAnchorEl(null);

        try {
            if (!itemId) {
                throw new Error('Item has no Id');
            }

            await updateUserRatingMutation({
                itemId,
                rating: value
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
    }, [itemId, queryClient, queryKey, updateUserRatingMutation]);

    const onRatingClick = useCallback(async (e: React.MouseEvent<HTMLLIElement>) => {
        await setRating(Number(e.currentTarget.dataset.value));
    }, [setRating]);

    const onClearClick = useCallback(async () => {
        await setRating(null);
    }, [setRating]);

    const isRated = rating !== null && rating !== undefined;

    return (
        <>
            <IconButton
                data-action={ItemAction.None}
                className={className}
                title={isRated ?
                    globalize.translate('MyRatingValue', rating) :
                    globalize.translate('MyRating')}
                size='small'
                onClick={onOpen}
            >
                {isRated ? <StarIcon color='primary' /> : <StarBorderIcon />}
            </IconButton>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={onClose}
            >
                {RATING_VALUES.map(value => (
                    <MenuItem
                        key={value}
                        data-value={value}
                        selected={rating === value}
                        onClick={onRatingClick}
                    >
                        {value}
                    </MenuItem>
                ))}

                {isRated && <Divider />}
                {isRated && (
                    <MenuItem onClick={onClearClick}>
                        {globalize.translate('ClearRating')}
                    </MenuItem>
                )}
            </Menu>
        </>
    );
};

export default UserRatingButton;
