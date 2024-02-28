import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { useQueryClient } from '@tanstack/react-query';
import React, { type FC, useCallback } from 'react';
import CheckIcon from '@mui/icons-material/Check';
import { IconButton } from '@mui/material';
import classNames from 'classnames';
import globalize from 'scripts/globalize';
import { useTogglePlayedMutation } from 'hooks/useFetchItems';

interface PlayedButtonProps {
    className?: string;
    isPlayed : boolean | undefined;
    itemId: string | null | undefined;
    itemType: string | null | undefined,
    queryKey?: string[]
}

const PlayedButton: FC<PlayedButtonProps> = ({
    className,
    isPlayed = false,
    itemId,
    itemType,
    queryKey
}) => {
    const queryClient = useQueryClient();
    const { mutateAsync: togglePlayedMutation } = useTogglePlayedMutation();

    const getTitle = useCallback(() => {
        let buttonTitle;
        if (itemType !== BaseItemKind.AudioBook) {
            buttonTitle = isPlayed ? globalize.translate('Watched') : globalize.translate('MarkPlayed');
        } else {
            buttonTitle = isPlayed ? globalize.translate('Played') : globalize.translate('MarkPlayed');
        }

        return buttonTitle;
    }, [itemType, isPlayed]);

    const onClick = useCallback(async () => {
        try {
            if (!itemId) {
                throw new Error('Item has no Id');
            }

            await togglePlayedMutation({
                itemId,
                isPlayed
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
    }, [itemId, togglePlayedMutation, isPlayed, queryClient, queryKey]);

    const btnClass = classNames(
        className,
        { 'playstatebutton-played': isPlayed }
    );

    const iconClass = classNames(
        { 'playstatebutton-icon-played': isPlayed }
    );
    return (
        <IconButton
            title={getTitle()}
            className={btnClass}
            size='small'
            onClick={onClick}
        >
            <CheckIcon className={iconClass} />
        </IconButton>
    );
};

export default PlayedButton;
