import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { useQueryClient } from '@tanstack/react-query';
import React, { type FC, useCallback } from 'react';
import { IconButton } from 'ui-primitives/IconButton';
import { CheckCircledIcon, CheckIcon } from '@radix-ui/react-icons';
import { deprecate } from '../../utils/deprecation';

import { ItemAction } from 'constants/itemAction';
import globalize from 'lib/globalize';
import { useTogglePlayedMutation } from 'hooks/useFetchItems';

interface PlayedButtonProps {
    className?: string;
    isPlayed: boolean | undefined;
    itemId: string | null | undefined;
    itemType: string | null | undefined;
    queryKey?: string[];
}

const PlayedButton: FC<PlayedButtonProps> = ({ className, isPlayed = false, itemId, itemType, queryKey }) => {
    deprecate(
        'emby-playstatebutton/PlayedButton',
        'Direct ui-primitives/IconButton usage with custom played logic',
        'src/elements/emby-playstatebutton/PlayedButton.tsx'
    );

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

    const onClick = useCallback(
        async (e: React.MouseEvent) => {
            e.stopPropagation();
            try {
                if (!itemId) {
                    throw new Error('Item has no Id');
                }

                await togglePlayedMutation(
                    {
                        itemId,
                        isPlayed
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
        [itemId, togglePlayedMutation, isPlayed, queryClient, queryKey]
    );

    return (
        <IconButton
            data-action={ItemAction.None}
            title={getTitle()}
            className={className}
            variant="plain"
            color={isPlayed ? 'success' : 'neutral'}
            size="sm"
            onClick={onClick}
        >
            {isPlayed ? <CheckCircledIcon /> : <CheckIcon />}
        </IconButton>
    );
};

export default PlayedButton;
