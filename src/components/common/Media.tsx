import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import React, { type FC } from 'react';
import type { ItemDto } from 'types/base/models/item-dto';
import DefaultIconText from './DefaultIconText';
import Image from './Image';

interface MediaProps {
    item: ItemDto;
    imgUrl: string | undefined;
    blurhash: string | undefined;
    imageType?: ImageType;
    defaultCardImageIcon?: string;
}

const Media: FC<MediaProps> = ({ item, imgUrl, blurhash, imageType, defaultCardImageIcon }) => {
    return imgUrl ? (
        <Image
            imgUrl={imgUrl}
            blurhash={blurhash}
            containImage={item.Type === BaseItemKind.TvChannel || imageType === ImageType.Logo}
        />
    ) : (
        <DefaultIconText item={item} defaultCardImageIcon={defaultCardImageIcon} />
    );
};

export default Media;
