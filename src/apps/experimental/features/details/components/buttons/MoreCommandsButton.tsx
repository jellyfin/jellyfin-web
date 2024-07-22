import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import React, { FC, useCallback } from 'react';
import { IconButton } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useQueryClient } from '@tanstack/react-query';
import globalize from 'scripts/globalize';
import itemContextMenu from 'components/itemContextMenu';
import { appRouter } from 'components/router/appRouter';
import type { ItemDto } from 'types/base/models/item-dto';

function getContextMenuOptions(
    item: ItemDto,
    user: UserDto | undefined,
    target?: EventTarget
) {
    return {
        item: item,
        open: false,
        play: false,
        playAllFromHere: false,
        queueAllFromHere: false,
        positionTo: target,
        cancelTimer: false,
        record: false,
        deleteItem: item?.CanDelete === true,
        shuffle: false,
        instantMix: false,
        user: user,
        share: true
    };
}

interface MoreCommandsButtonProps {
    item: ItemDto;
    user: UserDto | undefined;
}

const MoreCommandsButton: FC<MoreCommandsButtonProps> = ({ item, user }) => {
    const queryClient = useQueryClient();

    const onMoreCommandsClick = useCallback(async (event: React.MouseEvent<HTMLButtonElement>) => {
        itemContextMenu
            .show(getContextMenuOptions(item, user, event.target))
            .then(async function (result) {
                if (result.deleted) {
                    void appRouter.goHome();
                } else if (result.updated) {
                    await queryClient.invalidateQueries({
                        queryKey: ['DetailsItem']
                    });
                }
            })
            .catch(() => {
                /* no-op */
            });
    }, [item, queryClient, user]);

    if (itemContextMenu.getCommands(getContextMenuOptions(item, user)).length) {
        return (
            <IconButton
                className='button-flat btnMoreCommands'
                data-action='menu'
                title={globalize.translate('ButtonMore')}
                onClick={onMoreCommandsClick}
            >
                <MoreVertIcon />
            </IconButton>
        );
    }

    return null;
};

export default MoreCommandsButton;
