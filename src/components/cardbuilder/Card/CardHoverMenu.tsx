import React, { type FC } from 'react';
import classNames from 'classnames';
import { Box } from 'ui-primitives/Box';

import { appRouter } from 'components/router/appRouter';
import itemHelper from 'components/itemHelper';
import { playbackManager } from 'components/playback/playbackmanager';
import { ItemAction } from 'constants/itemAction';
import PlayedButton from '../../itemActions/PlayedButton';
import FavoriteButton from '../../itemActions/FavoriteButton';

import PlayArrowIconButton from '../../common/PlayArrowIconButton';
import MoreVertIconButton from '../../common/MoreVertIconButton';

import type { ItemDto } from 'types/base/models/item-dto';
import type { CardOptions } from 'types/cardOptions';

interface CardHoverMenuProps {
    action: ItemAction;
    item: ItemDto;
    cardOptions: CardOptions;
}

const CardHoverMenu: FC<CardHoverMenuProps> = ({ action, item, cardOptions }) => {
    const url = appRouter.getRouteUrl(item, {
        parentId: cardOptions.parentId ?? undefined
    });
    const btnCssClass = 'paper-icon-button-light cardOverlayButton cardOverlayButton-hover itemAction';

    const centerPlayButtonClass = classNames(btnCssClass, 'cardOverlayFab-primary');
    const { IsFavorite, Played } = item.UserData ?? {};

    return (
        <Box className="cardOverlayContainer itemAction" data-action={action}>
            <div className="cardImageContainer"></div>

            {playbackManager.canPlay(item) && (
                <PlayArrowIconButton className={centerPlayButtonClass} action={ItemAction.Play} title="Play" />
            )}

            <Box className="cardOverlayButton-br flex">
                {itemHelper.canMarkPlayed(item as any) && cardOptions.enablePlayedButton !== false && (
                    <PlayedButton
                        className={btnCssClass}
                        isPlayed={Played}
                        itemId={item.Id || ''}
                        itemType={item.Type}
                        queryKey={cardOptions.queryKey}
                    />
                )}

                {itemHelper.canRate(item as any) && cardOptions.enableRatingButton !== false && (
                    <FavoriteButton
                        className={btnCssClass}
                        isFavorite={IsFavorite}
                        itemId={item.Id || ''}
                        queryKey={cardOptions.queryKey}
                    />
                )}

                <MoreVertIconButton className={btnCssClass} />
            </Box>
        </Box>
    );
};

export default CardHoverMenu;
