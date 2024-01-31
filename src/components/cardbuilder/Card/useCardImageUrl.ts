import { BaseItemKind, ImageType } from '@jellyfin/sdk/lib/generated-client';
import { useApi } from 'hooks/useApi';
import { getDesiredAspect } from '../cardBuilderUtils';

import type { ItemDto } from 'types/itemDto';
import type { CardOptions } from 'types/cardOptions';

type ShapeType = string | null | undefined;

function getPreferThumbInfo(item: ItemDto, cardOptions: CardOptions) {
    let imgType;
    let itemId;
    let imgTag;
    let forceName = false;

    if (item.ImageTags?.Thumb) {
        imgType = ImageType.Thumb;
        imgTag = item.ImageTags.Thumb;
        itemId = item.Id;
    } else if (item.SeriesThumbImageTag && cardOptions.inheritThumb !== false) {
        imgType = ImageType.Thumb;
        imgTag = item.SeriesThumbImageTag;
        itemId = item.SeriesId;
    } else if (
        item.ParentThumbItemId
        && cardOptions.inheritThumb !== false
        && item.MediaType !== 'Photo'
    ) {
        imgType = ImageType.Thumb;
        imgTag = item.ParentThumbImageTag;
        itemId = item.ParentThumbItemId;
    } else if (item.BackdropImageTags?.length) {
        imgType = ImageType.Backdrop;
        imgTag = item.BackdropImageTags[0];
        itemId = item.Id;
        forceName = true;
    } else if (
        item.ParentBackdropImageTags?.length
        && cardOptions.inheritThumb !== false
        && item.Type === BaseItemKind.Episode
    ) {
        imgType = ImageType.Backdrop;
        imgTag = item.ParentBackdropImageTags[0];
        itemId = item.ParentBackdropItemId;
    }
    return {
        itemId: itemId,
        imgTag: imgTag,
        imgType: imgType,
        forceName: forceName
    };
}

function getPreferLogoInfo(item: ItemDto) {
    let imgType;
    let itemId;
    let imgTag;

    if (item.ImageTags?.Logo) {
        imgType = ImageType.Logo;
        imgTag = item.ImageTags.Logo;
        itemId = item.Id;
    } else if (item.ParentLogoImageTag && item.ParentLogoItemId) {
        imgType = ImageType.Logo;
        imgTag = item.ParentLogoImageTag;
        itemId = item.ParentLogoItemId;
    }
    return {
        itemId: itemId,
        imgTag: imgTag,
        imgType: imgType
    };
}

function getCalculatedHeight(
    width: number | undefined,
    primaryImageAspectRatio: number | null | undefined
) {
    if (width && primaryImageAspectRatio) {
        return Math.round(width / primaryImageAspectRatio);
    }
}

function isForceName(cardOptions: CardOptions) {
    return !!(cardOptions.preferThumb && cardOptions.showTitle !== false);
}

function isCoverImage(
    primaryImageAspectRatio: number | null | undefined,
    uiAspect: number | null
) {
    if (primaryImageAspectRatio && uiAspect) {
        return Math.abs(primaryImageAspectRatio - uiAspect) / uiAspect <= 0.2;
    }

    return false;
}

function shouldShowPreferBanner(
    imageTagsBanner: string | undefined,
    cardOptions: CardOptions,
    shape: ShapeType
): boolean {
    return (
        (cardOptions.preferBanner || shape === 'banner')
        && Boolean(imageTagsBanner)
    );
}

function shouldShowPreferDisc(
    imageTagsDisc: string | undefined,
    cardOptions: CardOptions
): boolean {
    return cardOptions.preferDisc === true && Boolean(imageTagsDisc);
}

function shouldShowImageTagsPrimary(item: ItemDto): boolean {
    return (
        Boolean(item.ImageTags?.Primary) && (item.Type !== BaseItemKind.Episode || item.ChildCount !== 0)
    );
}

function shouldShowImageTagsThumb(item: ItemDto): boolean {
    return item.Type === BaseItemKind.Season && Boolean(item.ImageTags?.Thumb);
}

function shouldShowSeriesThumbImageTag(
    item: ItemDto,
    cardOptions: CardOptions
): boolean {
    return (
        Boolean(item.SeriesThumbImageTag) && cardOptions.inheritThumb !== false
    );
}

function shouldShowParentThumbImageTag(
    item: ItemDto,
    cardOptions: CardOptions
): boolean {
    return (
        Boolean(item.ParentThumbItemId) && cardOptions.inheritThumb !== false
    );
}

function shouldShowParentBackdropImageTags(item: ItemDto): boolean {
    return Boolean(item.AlbumId) && Boolean(item.AlbumPrimaryImageTag);
}

function shouldShowPreferThumb(type: string | null | undefined, cardOptions: CardOptions): boolean {
    return Boolean(cardOptions.preferThumb) && !(type === BaseItemKind.Program || type === BaseItemKind.Episode);
}

function getCardImageInfo(
    item: ItemDto,
    cardOptions: CardOptions,
    shape: ShapeType
) {
    const width = cardOptions.width;
    let height;
    const primaryImageAspectRatio = item.PrimaryImageAspectRatio;
    let forceName = false;
    let imgTag;
    let coverImage = false;
    const uiAspect = getDesiredAspect(shape);
    let imgType;
    let itemId;

    if (shouldShowPreferThumb(item.Type, cardOptions)) {
        const preferThumbInfo = getPreferThumbInfo(item, cardOptions);
        imgType = preferThumbInfo.imgType;
        imgTag = preferThumbInfo.imgTag;
        itemId = preferThumbInfo.itemId;
        forceName = preferThumbInfo.forceName;
    } else if (shouldShowPreferBanner(item.ImageTags?.Banner, cardOptions, shape)) {
        imgType = ImageType.Banner;
        imgTag = item.ImageTags?.Banner;
        itemId = item.Id;
    } else if (shouldShowPreferDisc(item.ImageTags?.Disc, cardOptions)) {
        imgType = ImageType.Disc;
        imgTag = item.ImageTags?.Disc;
        itemId = item.Id;
    } else if (cardOptions.preferLogo) {
        const preferLogoInfo = getPreferLogoInfo(item);
        imgType = preferLogoInfo.imgType;
        imgTag = preferLogoInfo.imgType;
        itemId = preferLogoInfo.itemId;
    } else if (shouldShowImageTagsPrimary(item)) {
        imgType = ImageType.Primary;
        imgTag = item.ImageTags?.Primary;
        itemId = item.Id;
        height = getCalculatedHeight(width, primaryImageAspectRatio);
        forceName = isForceName(cardOptions);
        coverImage = isCoverImage(primaryImageAspectRatio, uiAspect);
    } else if (item.SeriesPrimaryImageTag) {
        imgType = ImageType.Primary;
        imgTag = item.SeriesPrimaryImageTag;
        itemId = item.SeriesId;
    } else if (item.PrimaryImageTag) {
        imgType = ImageType.Primary;
        imgTag = item.PrimaryImageTag;
        itemId = item.PrimaryImageItemId;
        height = getCalculatedHeight(width, primaryImageAspectRatio);
        forceName = isForceName(cardOptions);
        coverImage = isCoverImage(primaryImageAspectRatio, uiAspect);
    } else if (item.ParentPrimaryImageTag) {
        imgType = ImageType.Primary;
        imgTag = item.ParentPrimaryImageTag;
        itemId = item.ParentPrimaryImageItemId;
    } else if (shouldShowParentBackdropImageTags(item)) {
        imgType = ImageType.Primary;
        imgTag = item.AlbumPrimaryImageTag;
        itemId = item.AlbumId;
        height = getCalculatedHeight(width, primaryImageAspectRatio);
        forceName = isForceName(cardOptions);
        coverImage = isCoverImage(primaryImageAspectRatio, uiAspect);
    } else if (shouldShowImageTagsThumb(item)) {
        imgType = ImageType.Thumb;
        imgTag = item.ImageTags?.Thumb;
        itemId = item.Id;
    } else if (item.BackdropImageTags?.length) {
        imgType = ImageType.Backdrop;
        imgTag = item.BackdropImageTags[0];
        itemId = item.Id;
        /*} else if (item.ImageTags?.Thumb) {
        imgType = ImageType.Thumb;
        imgTag = item.ImageTags.Thumb;
        itemId = item.Id;*/
    } else if (shouldShowSeriesThumbImageTag(item, cardOptions)) {
        imgType = ImageType.Thumb;
        imgTag = item.SeriesThumbImageTag;
        itemId = item.SeriesId;
    } else if (shouldShowParentThumbImageTag(item, cardOptions)) {
        imgType = ImageType.Thumb;
        imgTag = item.ParentThumbImageTag;
        itemId = item.ParentThumbItemId;
    } else if (
        item.ParentBackdropImageTags?.length
        && cardOptions.inheritThumb !== false
    ) {
        imgType = ImageType.Backdrop;
        imgTag = item.ParentBackdropImageTags[0];
        itemId = item.ParentBackdropItemId;
    }

    return {
        imgType,
        imgTag,
        itemId,
        width,
        height,
        forceName,
        coverImage
    };
}

interface UseCardImageUrlProps {
    item: ItemDto;
    cardOptions: CardOptions;
    shape: ShapeType;
}

function useCardImageUrl({ item, cardOptions, shape }: UseCardImageUrlProps) {
    const { api } = useApi();
    const imgInfo = getCardImageInfo(item, cardOptions, shape);

    let width = imgInfo.width;
    let height = imgInfo.height;
    const imgTag = imgInfo.imgTag;
    const imgType = imgInfo.imgType;
    const itemId = imgInfo.itemId;
    const ratio = window.devicePixelRatio || 1;
    let imgUrl;
    let blurhash;

    if (api && imgTag && imgType && itemId) {
        if (width) {
            width = Math.round(width * ratio);
        }

        if (height) {
            height = Math.round(height * ratio);
        }
        imgUrl = api?.getItemImageUrl(itemId, imgType, {
            quality: 96,
            fillWidth: width,
            fillHeight: height,
            tag: imgTag
        });

        blurhash = item?.ImageBlurHashes?.[imgType]?.[imgTag];
    }

    return {
        imgUrl: imgUrl,
        blurhash: blurhash,
        forceName: imgInfo.forceName,
        coverImage: imgInfo.coverImage
    };
}

export default useCardImageUrl;
