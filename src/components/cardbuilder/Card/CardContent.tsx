import React, { type FC } from 'react';
import classNames from 'classnames';
import { getDefaultBackgroundClass } from '../cardBuilderUtils';
import CardImageContainer from './CardImageContainer';

import { useApi } from 'hooks/useApi';
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
    const { api } = useApi();

    const cardContentClass = classNames(
        'cardContent',
        // Only apply the default background class if there is no image, and we have an API instance. This prevents
        // cards rendering with a default background color and then switching to the image once the API instance is
        // available.
        { [getDefaultBackgroundClass(item.Name)]: api && !imgUrl }
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
