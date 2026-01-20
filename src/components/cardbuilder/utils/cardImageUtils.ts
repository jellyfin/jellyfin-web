import { getDesiredAspect } from '../cardBuilderUtils';

export function getCardImageUrl(item: any, apiClient: any, options: any, shape: string) {
    const pInfo = item.ProgramInfo || item;
    const width = options.width;
    let height: number | null = null;
    const primaryImageAspectRatio = pInfo.PrimaryImageAspectRatio;
    const uiAspect = getDesiredAspect(shape);
    let imgType: string | null = null;
    let imgTag: string | null = null;
    let itemId: string | null = null;

    if (options.preferThumb && pInfo.ImageTags?.Thumb) {
        imgType = 'Thumb';
        imgTag = pInfo.ImageTags.Thumb;
    } else if (pInfo.ImageTags?.Primary) {
        imgType = 'Primary';
        imgTag = pInfo.ImageTags.Primary;
    }

    if (!itemId) itemId = pInfo.Id;

    let imgUrl: string | null = null;
    if (imgTag && imgType) {
        if (!height && width && uiAspect) height = width / uiAspect;
        imgUrl = apiClient.getScaledImageUrl(itemId, {
            type: imgType,
            fillHeight: height,
            fillWidth: width,
            quality: 96,
            tag: imgTag
        });
    }

    const blurHashes = options.imageBlurhashes || pInfo.ImageBlurHashes || {};

    return {
        imgUrl: imgUrl,
        blurhash: blurHashes[imgType || '']?.[imgTag || ''],
        forceName: false,
        coverImage: false
    };
}