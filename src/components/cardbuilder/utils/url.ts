import { Api } from '@jellyfin/sdk';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { getImageApi } from '@jellyfin/sdk/lib/utils/api/image-api';

import { ItemDto } from 'types/base/models/item-dto';
import { CardOptions } from 'types/cardOptions';

import { getDesiredAspect } from './builder';
import { CardShape } from './shape';

interface CardImageUrlParams {
    api?: Api;
    item: ItemDto;
    options: CardOptions;
    shape?: CardShape;
}

// eslint-disable-next-line sonarjs/cognitive-complexity
export function getCardImageUrl({
    api,
    item,
    options,
    shape
}: CardImageUrlParams) {
    if (!api) {
        throw new Error('API instance is required to get card image URL');
    }

    item = item.ProgramInfo || item;

    const width = options.width;
    let height: number | undefined;
    const primaryImageAspectRatio = item.PrimaryImageAspectRatio;
    let forceName = false;
    let imgUrl: string | undefined;
    let imgTag = null;
    let coverImage = false;
    const uiAspect = getDesiredAspect(shape);
    let imgType: ImageType | undefined;
    let itemId = null;

    /* eslint-disable sonarjs/no-duplicated-branches */
    if (options.preferThumb && item.ImageTags?.Thumb) {
        imgType = ImageType.Thumb;
        imgTag = item.ImageTags.Thumb;
    } else if ((options.preferBanner || shape === CardShape.Banner) && item.ImageTags?.Banner) {
        imgType = ImageType.Banner;
        imgTag = item.ImageTags.Banner;
    } else if (options.preferDisc && item.ImageTags?.Disc) {
        imgType = ImageType.Disc;
        imgTag = item.ImageTags.Disc;
    } else if (options.preferLogo && item.ImageTags?.Logo) {
        imgType = ImageType.Logo;
        imgTag = item.ImageTags.Logo;
    } else if (options.preferLogo && item.ParentLogoImageTag && item.ParentLogoItemId) {
        imgType = ImageType.Logo;
        imgTag = item.ParentLogoImageTag;
        itemId = item.ParentLogoItemId;
    } else if (options.preferThumb && item.SeriesThumbImageTag && options.inheritThumb !== false) {
        imgType = ImageType.Thumb;
        imgTag = item.SeriesThumbImageTag;
        itemId = item.SeriesId;
    } else if (options.preferThumb && item.ParentThumbItemId && options.inheritThumb !== false && item.MediaType !== 'Photo') {
        imgType = ImageType.Thumb;
        imgTag = item.ParentThumbImageTag;
        itemId = item.ParentThumbItemId;
    } else if (options.preferThumb && item.BackdropImageTags?.length) {
        imgType = ImageType.Backdrop;
        imgTag = item.BackdropImageTags[0];
        forceName = true;
    } else if (options.preferThumb && item.ParentBackdropImageTags?.length && options.inheritThumb !== false && item.Type === 'Episode') {
        imgType = ImageType.Backdrop;
        imgTag = item.ParentBackdropImageTags[0];
        itemId = item.ParentBackdropItemId;
    } else if (item.ImageTags?.Primary && (item.Type !== 'Episode' || item.ChildCount !== 0)) {
        imgType = ImageType.Primary;
        imgTag = item.ImageTags.Primary;
        height = width && primaryImageAspectRatio ? (width / primaryImageAspectRatio) : undefined;

        if (options.preferThumb && options.showTitle !== false) {
            forceName = true;
        }

        if (primaryImageAspectRatio && uiAspect) {
            coverImage = (Math.abs(primaryImageAspectRatio - uiAspect) / uiAspect) <= 0.2;
        }
    } else if (item.SeriesPrimaryImageTag) {
        imgType = ImageType.Primary;
        imgTag = item.SeriesPrimaryImageTag;
        itemId = item.SeriesId;
    } else if (item.PrimaryImageTag) {
        imgType = ImageType.Primary;
        imgTag = item.PrimaryImageTag;
        itemId = item.PrimaryImageItemId;
        height = width && primaryImageAspectRatio ? (width / primaryImageAspectRatio) : undefined;

        if (options.preferThumb && options.showTitle !== false) {
            forceName = true;
        }

        if (primaryImageAspectRatio && uiAspect) {
            coverImage = (Math.abs(primaryImageAspectRatio - uiAspect) / uiAspect) <= 0.2;
        }
    } else if (item.ParentPrimaryImageTag) {
        imgType = ImageType.Primary;
        imgTag = item.ParentPrimaryImageTag;
        itemId = item.ParentPrimaryImageItemId;
    } else if (item.AlbumId && item.AlbumPrimaryImageTag) {
        imgType = ImageType.Primary;
        imgTag = item.AlbumPrimaryImageTag;
        itemId = item.AlbumId;
        height = width && primaryImageAspectRatio ? (width / primaryImageAspectRatio) : undefined;

        if (primaryImageAspectRatio && uiAspect) {
            coverImage = (Math.abs(primaryImageAspectRatio - uiAspect) / uiAspect) <= 0.2;
        }
    } else if (item.Type === 'Season' && item.ImageTags?.Thumb) {
        imgType = ImageType.Thumb;
        imgTag = item.ImageTags.Thumb;
    } else if (item.BackdropImageTags?.length) {
        imgType = ImageType.Backdrop;
        imgTag = item.BackdropImageTags[0];
    } else if (item.ImageTags?.Thumb) {
        imgType = ImageType.Thumb;
        imgTag = item.ImageTags.Thumb;
    } else if (item.SeriesThumbImageTag && options.inheritThumb !== false) {
        imgType = ImageType.Thumb;
        imgTag = item.SeriesThumbImageTag;
        itemId = item.SeriesId;
    } else if (item.ParentThumbItemId && options.inheritThumb !== false) {
        imgType = ImageType.Thumb;
        imgTag = item.ParentThumbImageTag;
        itemId = item.ParentThumbItemId;
    } else if (item.ParentBackdropImageTags?.length && options.inheritThumb !== false) {
        imgType = ImageType.Backdrop;
        imgTag = item.ParentBackdropImageTags[0];
        itemId = item.ParentBackdropItemId;
    }
    /* eslint-enable sonarjs/no-duplicated-branches */

    if (!itemId) {
        itemId = item.Id;
    }

    if (itemId && imgTag && imgType) {
        if (!height && width && uiAspect) {
            height = width / uiAspect;
        }

        imgUrl = getImageApi(api).getItemImageUrlById(
            itemId,
            imgType,
            {
                // Dimensions must be rounded or the API will reject the request
                fillHeight: height ? Math.round(height) : undefined,
                fillWidth: width ? Math.round(width) : undefined,
                quality: 96,
                tag: imgTag
            }
        );
    }

    const blurHashes = options.imageBlurhashes || item.ImageBlurHashes || {};

    return {
        imgUrl,
        blurhash: (imgType && imgTag) ? blurHashes[imgType]?.[imgTag] : undefined,
        forceName,
        coverImage
    };
}
