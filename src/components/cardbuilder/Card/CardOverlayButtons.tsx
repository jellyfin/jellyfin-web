import { LocationType } from '@jellyfin/sdk/lib/generated-client/models/location-type';
import React, { type FC } from 'react';
import ButtonGroup from '@mui/material/ButtonGroup';
import classNames from 'classnames';
import { appRouter } from 'components/router/appRouter';
import PlayArrowIconButton from '../../common/PlayArrowIconButton';
import MoreVertIconButton from '../../common/MoreVertIconButton';

import { ItemKind } from 'types/base/models/item-kind';
import { ItemMediaKind } from 'types/base/models/item-media-kind';
import type { ItemDto } from 'types/base/models/item-dto';
import type { CardOptions } from 'types/cardOptions';

const sholudShowOverlayPlayButton = (
    overlayPlayButton: boolean | undefined,
    item: ItemDto
) => {
    return (
        overlayPlayButton
        && !item.IsPlaceHolder
        && (item.LocationType !== LocationType.Virtual
            || !item.MediaType
            || item.Type === ItemKind.Program)
        && item.Type !== ItemKind.Person
    );
};

interface CardOverlayButtonsProps {
    item: ItemDto;
    cardOptions: CardOptions;
}

const CardOverlayButtons: FC<CardOverlayButtonsProps> = ({
    item,
    cardOptions
}) => {
    let overlayPlayButton = cardOptions.overlayPlayButton;

    if (
        overlayPlayButton == null
        && !cardOptions.overlayMoreButton
        && !cardOptions.overlayInfoButton
        && !cardOptions.cardLayout
    ) {
        overlayPlayButton = item.MediaType === ItemMediaKind.Video;
    }

    const url = appRouter.getRouteUrl(item, {
        parentId: cardOptions.parentId
    });

    const btnCssClass = classNames(
        'paper-icon-button-light',
        'cardOverlayButton',
        'itemAction'
    );

    const centerPlayButtonClass = classNames(
        btnCssClass,
        'cardOverlayButton-centered'
    );

    return (
        <a
            href={url}
            aria-label={item.Name || ''}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                userSelect: 'none',
                borderRadius: '0.2em'
            }}
        >

            {cardOptions.centerPlayButton && (
                <PlayArrowIconButton
                    className={centerPlayButtonClass}
                    action='play'
                    title='Play'
                />
            )}

            <ButtonGroup className='cardOverlayButton-br'>
                {sholudShowOverlayPlayButton(overlayPlayButton, item) && (
                    <PlayArrowIconButton
                        className={btnCssClass}
                        action='play'
                        title='Play'
                    />
                )}

                {cardOptions.overlayMoreButton && (
                    <MoreVertIconButton
                        className={btnCssClass}
                    />
                )}
            </ButtonGroup>
        </a>
    );
};

export default CardOverlayButtons;
