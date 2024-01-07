import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client';
import React, { FC, useCallback } from 'react';
import CheckIcon from '@mui/icons-material/Check';
import { IconButton } from '@mui/material';
import classNames from 'classnames';
import globalize from 'scripts/globalize';
import { useTogglePlayedMutation } from 'hooks/useFetchItems';

interface PlayedButtonProps {
    className?: string;
    playedState : boolean | undefined;
    itemId: string | null | undefined;
    itemType: string | null | undefined
}

const PlayedButton: FC<PlayedButtonProps> = ({
    className,
    playedState = false,
    itemId,
    itemType
}) => {
    const { mutateAsync: togglePlayedMutation } = useTogglePlayedMutation();
    const [isPlayed, setIsPlayed] = React.useState<boolean | undefined>(
        playedState ?? false
    );

    const getTitle = useCallback(() => {
        let buttonTitle;
        if (itemType !== BaseItemKind.AudioBook) {
            buttonTitle = isPlayed ? globalize.translate('Watched') : globalize.translate('MarkPlayed');
        } else {
            buttonTitle = isPlayed ? globalize.translate('Played') : globalize.translate('MarkPlayed');
        }

        return buttonTitle;
    }, [isPlayed, itemType]);

    const onClick = useCallback(async () => {
        try {
            if (!itemId) {
                throw new Error('Item has no Id');
            }

            const response = await togglePlayedMutation({
                itemId,
                isPlayed
            });
            setIsPlayed(response?.Played);
        } catch (e) {
            console.error(e);
        }
    }, [isPlayed, itemId, togglePlayedMutation]);

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
