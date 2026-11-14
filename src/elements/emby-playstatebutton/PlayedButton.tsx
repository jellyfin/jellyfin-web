import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { type QueryKey, useQueryClient } from '@tanstack/react-query';
import React, { type FC, useCallback, useEffect, useState } from 'react';
import IconButton from '@mui/material/IconButton';
import CheckIcon from '@mui/icons-material/Check';

import { useTogglePlayedMutation } from 'apps/modern/features/libraries/hooks/api/useTogglePlayed';
import toast from 'components/toast/toast';
import { ItemAction } from 'constants/itemAction';
import globalize from 'lib/globalize';

interface PlayedButtonProps {
    className?: string;
    isPlayed : boolean | undefined;
    itemId: string | null | undefined;
    itemType: string | null | undefined,
    queryKey?: QueryKey
}

const PlayedButton: FC<PlayedButtonProps> = ({
    className,
    isPlayed = false,
    itemId,
    itemType,
    queryKey
}) => {
    const queryClient = useQueryClient();
    const { mutateAsync: togglePlayedMutation, isPending } = useTogglePlayedMutation();
    // Shown state: flips as soon as the button is clicked and follows the item data when it changes
    const [ played, setPlayed ] = useState(isPlayed);

    useEffect(() => {
        setPlayed(isPlayed);
    }, [ isPlayed ]);

    const getTitle = useCallback(() => {
        let buttonTitle;
        if (itemType !== BaseItemKind.AudioBook) {
            buttonTitle = played ? globalize.translate('Watched') : globalize.translate('MarkPlayed');
        } else {
            buttonTitle = played ? globalize.translate('Played') : globalize.translate('MarkPlayed');
        }

        return buttonTitle;
    }, [itemType, played]);

    const onClick = useCallback(async () => {
        if (!itemId) {
            console.error('[PlayedButton] item has no Id');
            return;
        }

        const previous = played;
        setPlayed(!previous);

        let result: boolean | undefined;
        try {
            result = await togglePlayedMutation({
                itemId,
                isPlayed: previous
            });
        } catch (e) {
            console.error('[PlayedButton] failed to update played state', e);
            setPlayed(previous);
            toast(globalize.translate('ErrorDefault'));
            return;
        }

        setPlayed(result ?? !previous);
        await queryClient.invalidateQueries({
            queryKey,
            type: 'all',
            refetchType: 'active'
        });
    }, [itemId, played, togglePlayedMutation, queryClient, queryKey]);

    return (
        <IconButton
            data-action={ItemAction.None}
            title={getTitle()}
            className={className}
            size='small'
            disabled={isPending}
            onClick={onClick}
        >
            <CheckIcon
                color={played ? 'error' : undefined}
            />
        </IconButton>
    );
};

export default PlayedButton;
