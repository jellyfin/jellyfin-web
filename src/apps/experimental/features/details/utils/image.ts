import type { Api } from '@jellyfin/sdk';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { getImageApi } from '@jellyfin/sdk/lib/utils/api/image-api';
import { randomInt } from 'utils/number';

import type { ItemDto } from 'types/base/models/item-dto';
import { ScaleImageOpts } from '../types';

export function getItemBackdropImageUrl(
    item: ItemDto,
    api: Api | undefined,
    random: boolean,
    scaleImageOpts: ScaleImageOpts
) {
    let imgType;
    let imgTag;
    let itemId;
    let imgIndex;

    if (item.Id && item.BackdropImageTags?.length) {
        const backdropImgIndex = random ? randomInt(0, item.BackdropImageTags.length - 1) : 0;
        imgType = ImageType.Backdrop;
        imgIndex = backdropImgIndex;
        imgTag = item.BackdropImageTags[backdropImgIndex];
        itemId = item.Id;
    } else if (
        item.ParentBackdropItemId
        && item.ParentBackdropImageTags?.length
    ) {
        const backdropImgIndex = random ? randomInt(0, item.ParentBackdropImageTags.length - 1) : 0;
        imgType = ImageType.Backdrop;
        imgIndex = backdropImgIndex;
        imgTag = item.ParentBackdropImageTags[backdropImgIndex];
        itemId = item.ParentBackdropItemId;
    } else if (item.ImageTags?.Primary) {
        imgType = ImageType.Primary;
        imgTag = item.ImageTags.Primary;
        itemId = item.Id;
    }

    if (!itemId) {
        itemId = item.Id;
    }

    if (api && imgTag && imgType && itemId) {
        const response = getImageApi(api).getItemImageUrlById(itemId, imgType, {
            ...scaleImageOpts,
            imageIndex: imgIndex
        });

        return {
            imgUrl: response,
            blurhash: item?.ImageBlurHashes?.[imgType]?.[imgTag]
        };
    }

    return {
        imgUrl: undefined,
        blurhash: undefined
    };
}
