import { getSquareShape, getBackdropShape } from 'utils/card';
import layoutManager from 'components/layoutManager';
import imageLoader from 'components/images/imageLoader';
import dom from 'utils/dom';

export function getCardImageUrl(item, apiClient, options, shape) {
    item = item.ProgramInfo || item;

    const width = options.width;
    let height = null;
    const primaryImageAspectRatio = item.PrimaryImageAspectRatio;
    let forceName = false;
    let imgUrl = null;
    let imgTag = null;
    let coverImage = false;
    const uiAspect = getDesiredAspect(shape);
    let imgType = null;
    let itemId = null;

    if (options.preferThumb && item.ImageTags?.Thumb) {
        imgType = 'Thumb';
        imgTag = item.ImageTags.Thumb;
    } else if ((options.preferBanner || shape === 'banner') && item.ImageTags?.Banner) {
        imgType = 'Banner';
        imgTag = item.ImageTags.Banner;
    } else if (options.preferDisc && item.ImageTags?.Disc) {
        imgType = 'Disc';
        imgTag = item.ImageTags.Disc;
    } else if (options.preferLogo && item.ImageTags?.Logo) {
        imgType = 'Logo';
        imgTag = item.ImageTags.Logo;
    } else if (options.preferLogo && item.ParentLogoImageTag && item.ParentLogoItemId) {
        imgType = 'Logo';
        imgTag = item.ParentLogoImageTag;
        itemId = item.ParentLogoItemId;
    } else if (options.preferThumb && item.SeriesThumbImageTag && options.inheritThumb !== false) {
        imgType = 'Thumb';
        imgTag = item.SeriesThumbImageTag;
        itemId = item.SeriesId;
    } else if (options.preferThumb && item.ParentThumbItemId && options.inheritThumb !== false && item.MediaType !== 'Photo') {
        imgType = 'Thumb';
        imgTag = item.ParentThumbImageTag;
        itemId = item.ParentThumbItemId;
    } else if (options.preferThumb && item.BackdropImageTags?.length) {
        imgType = 'Backdrop';
        imgTag = item.BackdropImageTags[0];
        forceName = true;
    } else if (options.preferThumb && item.ParentBackdropImageTags?.length && options.inheritThumb !== false && item.Type === 'Episode') {
        imgType = 'Backdrop';
        imgTag = item.ParentBackdropImageTags[0];
        itemId = item.ParentBackdropItemId;
    } else if (item.ImageTags?.Primary && (item.Type !== 'Episode' || item.ChildCount !== 0)) {
        imgType = 'Primary';
        imgTag = item.ImageTags.Primary;
        height = width && primaryImageAspectRatio ? Math.round(width / primaryImageAspectRatio) : null;

        if (options.preferThumb && options.showTitle !== false) {
            forceName = true;
        }

        if (primaryImageAspectRatio && uiAspect) {
            coverImage = (Math.abs(primaryImageAspectRatio - uiAspect) / uiAspect) <= 0.2;
        }
    } else if (item.SeriesPrimaryImageTag) {
        imgType = 'Primary';
        imgTag = item.SeriesPrimaryImageTag;
        itemId = item.SeriesId;
    } else if (item.PrimaryImageTag) {
        imgType = 'Primary';
        imgTag = item.PrimaryImageTag;
        itemId = item.PrimaryImageItemId;
        height = width && primaryImageAspectRatio ? Math.round(width / primaryImageAspectRatio) : null;

        if (options.preferThumb && options.showTitle !== false) {
            forceName = true;
        }

        if (primaryImageAspectRatio && uiAspect) {
            coverImage = (Math.abs(primaryImageAspectRatio - uiAspect) / uiAspect) <= 0.2;
        }
    } else if (item.ParentPrimaryImageTag) {
        imgType = 'Primary';
        imgTag = item.ParentPrimaryImageTag;
        itemId = item.ParentPrimaryImageItemId;
    } else if (item.AlbumId && item.AlbumPrimaryImageTag) {
        imgType = 'Primary';
        imgTag = item.AlbumPrimaryImageTag;
        itemId = item.AlbumId;
        height = width && primaryImageAspectRatio ? Math.round(width / primaryImageAspectRatio) : null;

        if (primaryImageAspectRatio && uiAspect) {
            coverImage = (Math.abs(primaryImageAspectRatio - uiAspect) / uiAspect) <= 0.2;
        }
    } else if (item.Type === 'Season' && item.ImageTags?.Thumb) {
        imgType = 'Thumb';
        imgTag = item.ImageTags.Thumb;
    } else if (item.BackdropImageTags?.length) {
        imgType = 'Backdrop';
        imgTag = item.BackdropImageTags[0];
    } else if (item.ImageTags?.Thumb) {
        imgType = 'Thumb';
        imgTag = item.ImageTags.Thumb;
    } else if (item.SeriesThumbImageTag && options.inheritThumb !== false) {
        imgType = 'Thumb';
        imgTag = item.SeriesThumbImageTag;
        itemId = item.SeriesId;
    } else if (item.ParentThumbItemId && options.inheritThumb !== false) {
        imgType = 'Thumb';
        imgTag = item.ParentThumbImageTag;
        itemId = item.ParentThumbItemId;
    } else if (item.ParentBackdropImageTags?.length && options.inheritThumb !== false) {
        imgType = 'Backdrop';
        imgTag = item.ParentBackdropImageTags[0];
        itemId = item.ParentBackdropItemId;
    }

    if (!itemId) {
        itemId = item.Id;
    }

    if (imgTag && imgType) {
        if (!height && width && uiAspect) {
            height = width / uiAspect;
        }
        imgUrl = apiClient.getScaledImageUrl(itemId, {
            type: imgType,
            fillHeight: height,
            fillWidth: width,
            quality: 96,
            tag: imgTag
        });
    }

    const blurHashes = options.imageBlurhashes || item.ImageBlurHashes || {};

    return {
        imgUrl: imgUrl,
        blurhash: blurHashes[imgType]?.[imgTag],
        forceName: forceName,
        coverImage: coverImage
    };
}

function getDesiredAspect(shape) {
    if (shape === 'backdrop' || shape === 'overflowBackdrop') {
        return 16/9;
    } else if (shape === 'banner' || shape === 'overflow') {
        return 0;
    } else if (shape === 'square') {
        return 1;
    }
    return 2/3;
}
