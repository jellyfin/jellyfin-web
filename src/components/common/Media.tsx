import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import React, { type FC } from 'react';

import { Image } from './image';
import DefaultIconText from './DefaultIconText';
import type { ItemDto } from 'types/base/models/item-dto';
import { ItemKind } from 'types/base/models/item-kind';

interface MediaProps {
    item: ItemDto;
    imgUrl?: string;
    blurhash?: string;
    imageType?: ImageType;
    containImage?: boolean;
    defaultCardImageIcon?: string;
}

const Media: FC<MediaProps> = ({
    item,
    imgUrl,
    blurhash,
    imageType,
    containImage,
    defaultCardImageIcon
}) => {
    return imgUrl ? (
        <Image
            className='card-image'
            imgUrl={imgUrl}
            blurhash={blurhash}
            containImage={
                item?.Type === ItemKind.TvChannel
                || imageType === ImageType.Logo
                || containImage
            }
        />
    ) : (
        <DefaultIconText
            item={item}
            defaultCardImageIcon={defaultCardImageIcon}
        />
    );
};

export default Media;
