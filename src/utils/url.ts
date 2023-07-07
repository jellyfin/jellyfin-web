import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { randomInt } from './number';
import { ApiClient } from 'jellyfin-apiclient';

/**
 * Gets the url search string.
 * This function should be used instead of location.search alone, because the app router
 * includes search parameters in the hash portion of the url.
 * @returns The url search string.
 */
export const getLocationSearch = () => {
    // Return location.search if it exists
    if (window.location.search) {
        return window.location.search;
    }

    // Check the entire url in case the search string is in the hash
    const index = window.location.href.indexOf('?');
    if (index !== -1) {
        return window.location.href.substring(index);
    }

    return '';
};

/**
 * Gets the value of a url search parameter by name.
 * @param name The parameter name.
 * @param url The url to search (optional).
 * @returns The parameter value.
 */
export const getParameterByName = (name: string, url?: string | null | undefined) => {
    if (!url) {
        url = getLocationSearch();
    }

    // eslint-disable-next-line compat/compat
    return new URLSearchParams(url).get(name) || '';
};

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
 * Returns the url of a random backdrop image of an item.
 * If the item has no backdrop image, the url of a random backdrop image of the parent item is returned.
 * Falls back to the primary image (cover) of the item, if neither the item nor it's parent have at least one backdrop image.
 * Returns undefined if no usable image was found.
 * @param apiClient The ApiClient to generate the url.
 * @param item The item for which the backdrop image is requested.
 * @param options Optional; allows to scale the backdrop image.
 * @returns The url of a random backdrop image of the provided item.
 */
export const getRandomItemBackdropImageUrl = (apiClient: ApiClient, item: BaseItemDto, options: ScaleImageOptions = {}): string | undefined => {
    let imgUrl;

    if (item.BackdropImageTags && item.BackdropImageTags.length) {
        const backdropImgIndex = randomInt(0, item.BackdropImageTags.length - 1);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        imgUrl = apiClient.getScaledImageUrl(item.Id!, {
            type: 'Backdrop',
            index: backdropImgIndex,
            tag: item.BackdropImageTags[backdropImgIndex],
            ...options
        });
    } else if (item.ParentBackdropItemId && item.ParentBackdropImageTags && item.ParentBackdropImageTags.length) {
        const backdropImgIndex = randomInt(0, item.ParentBackdropImageTags.length - 1);
        imgUrl = apiClient.getScaledImageUrl(item.ParentBackdropItemId, {
            type: 'Backdrop',
            index: backdropImgIndex,
            tag: item.ParentBackdropImageTags[backdropImgIndex],
            ...options
        });
    } else if (item.ImageTags && item.ImageTags.Primary) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        imgUrl = apiClient.getScaledImageUrl(item.Id!, {
            type: 'Primary',
            tag: item.ImageTags.Primary,
            ...options
        });
    }
    return imgUrl;
};
