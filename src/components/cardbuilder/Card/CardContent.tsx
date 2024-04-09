import React, { type FC } from 'react';
import classNames from 'classnames';
import { getDefaultBackgroundClass } from '../cardBuilderUtils';
import CardImageContainer from './CardImageContainer';

import type { ItemDto } from 'types/base/models/item-dto';
import type { CardOptions } from 'types/cardOptions';

interface CardContentProps {
    item: ItemDto;
    cardOptions: CardOptions;
    coveredImage: boolean;
    overlayText: boolean | undefined;
    imgUrl: string | undefined;
    blurhash: string | undefined;
    forceName: boolean;
}

const CardContent: FC<CardContentProps> = ({
    item,
    cardOptions,
    coveredImage,
    overlayText,
    imgUrl,
    blurhash,
    forceName
}) => {
    const cardContentClass = classNames(
        'cardContent',
        { [getDefaultBackgroundClass(item.Name)]: !imgUrl }
    );

    return (
        <div
            className={cardContentClass}
        >
            <CardImageContainer
                item={item}
                cardOptions={cardOptions}
                coveredImage={coveredImage}
                overlayText={overlayText}
                imgUrl={imgUrl}
                blurhash={blurhash}
                forceName={forceName}
            />
        </div>
    );
};

export default CardContent;
