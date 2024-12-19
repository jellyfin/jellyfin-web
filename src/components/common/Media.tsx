import { ImageType } from '@jellyfin/sdk/lib/generated-client';
import React, { type FC } from 'react';
import Image from './image/Image';
import DefaultIconText from './DefaultIconText';
import type { ItemDto } from 'types/base/models/item-dto';
import { ItemKind } from 'types/base/models/item-kind';

interface MediaProps {
    item: ItemDto;
    imgUrl: string | undefined;
    blurhash: string | undefined;
    imageType?: ImageType
    defaultCardImageIcon?: string
}

const Media: FC<MediaProps> = ({
    item,
    imgUrl,
    blurhash,
    imageType,
    defaultCardImageIcon
}) => {
    return imgUrl ? (
        <Image
            className='card-image'
            imgUrl={imgUrl}
            blurhash={blurhash}
            containImage={item.Type === ItemKind.TvChannel || imageType === ImageType.Logo}
        />
    ) : (
        <DefaultIconText
            item={item}
            defaultCardImageIcon={defaultCardImageIcon}
        />
    );
};

export default Media;
