import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client';
import React, { FC, useCallback } from 'react';
import CheckIcon from '@mui/icons-material/Check';
import { IconButton } from '@mui/material';
import classNames from 'classnames';
import globalize from 'scripts/globalize';
import { useTogglePlayedMutation } from 'hooks/useFetchItems';

interface PlayedButtonProps {
    className?: string;
    isPlayed : boolean | undefined;
    itemId: string | null | undefined;
    itemType: string | null | undefined
}

const PlayedButton: FC<PlayedButtonProps> = ({
    className,
    isPlayed = false,
    itemId,
    itemType
}) => {
    const { mutateAsync: togglePlayedMutation } = useTogglePlayedMutation();
    const [playedState, setPlayedState] = React.useState<boolean>(isPlayed);

    const getTitle = useCallback(() => {
        let buttonTitle;
        if (itemType !== BaseItemKind.AudioBook) {
            buttonTitle = playedState ? globalize.translate('Watched') : globalize.translate('MarkPlayed');
        } else {
            buttonTitle = playedState ? globalize.translate('Played') : globalize.translate('MarkPlayed');
        }

        return buttonTitle;
    }, [playedState, itemType]);

    const onClick = useCallback(async () => {
        try {
            if (!itemId) {
                throw new Error('Item has no Id');
            }

            const _isPlayed = await togglePlayedMutation({
                itemId,
                playedState
            });
            setPlayedState(!!_isPlayed);
        } catch (e) {
            console.error(e);
        }
    }, [playedState, itemId, togglePlayedMutation]);

    const btnClass = classNames(
        className,
        { 'playstatebutton-played': playedState }
    );

    const iconClass = classNames(
        { 'playstatebutton-icon-played': playedState }
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
