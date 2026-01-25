import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import type { ApiClient } from 'jellyfin-apiclient';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { randomInt } from '../number';

export interface ScaleImageOptions {
    maxWidth?: number;
    width?: number;
    maxHeight?: number;
    height?: number;
    fillWidth?: number;
    fillHeight?: number;
    quality?: number;
}

/**
 * Returns the url of the first or a random backdrop image of an item.
 * If the item has no backdrop image, the url of the first or a random backdrop image of the parent item is returned.
 * Falls back to the primary image (cover) of the item, if neither the item nor it's parent have at least one backdrop image.
 * Returns undefined if no usable image was found.
 * @param apiClient The ApiClient to generate the url.
 * @param item The item for which the backdrop image is requested.
 * @param options Optional; allows to scale the backdrop image.
 * @param random If set to true and the item has more than one backdrop, a random image is returned.
 * @returns The url of the first or a random backdrop image of the provided item.
 */
export const getItemBackdropImageUrl = (
    apiClient: ApiClient,
    item: BaseItemDto,
    options: ScaleImageOptions = {},
    random = false
): string | undefined => {
    if (item.Id && item.BackdropImageTags?.length) {
        const backdropImgIndex = random ? randomInt(0, item.BackdropImageTags.length - 1) : 0;
        return apiClient.getScaledImageUrl(item.Id, {
            type: ImageType.Backdrop,
            index: backdropImgIndex,
            tag: item.BackdropImageTags[backdropImgIndex],
            ...options
        });
    } else if (item.ParentBackdropItemId && item.ParentBackdropImageTags?.length) {
        const backdropImgIndex = random ? randomInt(0, item.ParentBackdropImageTags.length - 1) : 0;
        return apiClient.getScaledImageUrl(item.ParentBackdropItemId, {
            type: ImageType.Backdrop,
            index: backdropImgIndex,
            tag: item.ParentBackdropImageTags[backdropImgIndex],
            ...options
        });
    } else if (item.Id && item.ImageTags?.Primary) {
        return apiClient.getScaledImageUrl(item.Id, {
            type: ImageType.Primary,
            tag: item.ImageTags.Primary,
            ...options
        });
    }
    return undefined;
};
