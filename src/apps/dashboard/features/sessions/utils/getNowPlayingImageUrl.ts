import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import dom from 'utils/dom';

const getNowPlayingImageUrl = (item: BaseItemDto) => {
    if (!item.ServerId) return null;

    const apiClient = ServerConnections.getApiClient(item.ServerId);

    /* Screen width is multiplied by 0.2, as the there is currently no way to get the width of
                elements that aren't created yet. */
    if (item?.BackdropImageTags?.length && item.Id) {
        return apiClient.getScaledImageUrl(item.Id, {
            maxWidth: Math.round(dom.getScreenWidth() * 0.2),
            type: ImageType.Backdrop,
            tag: item.BackdropImageTags[0]
        });
    }

    if (item?.ParentBackdropImageTags?.length && item.ParentBackdropItemId) {
        return apiClient.getScaledImageUrl(item.ParentBackdropItemId, {
            maxWidth: Math.round(dom.getScreenWidth() * 0.2),
            type: ImageType.Backdrop,
            tag: item.ParentBackdropImageTags[0]
        });
    }

    const imageTags = item?.ImageTags || {};

    if (item?.Id && imageTags.Thumb) {
        return apiClient.getScaledImageUrl(item.Id, {
            maxWidth: Math.round(dom.getScreenWidth() * 0.2),
            type: ImageType.Thumb,
            tag: imageTags.Thumb
        });
    }

    if (item?.ParentThumbImageTag && item.ParentThumbItemId) {
        return apiClient.getScaledImageUrl(item.ParentThumbItemId, {
            maxWidth: Math.round(dom.getScreenWidth() * 0.2),
            type: ImageType.Thumb,
            tag: item.ParentThumbImageTag
        });
    }

    if (item?.Id && imageTags.Primary) {
        return apiClient.getScaledImageUrl(item.Id, {
            maxWidth: Math.round(dom.getScreenWidth() * 0.2),
            type: ImageType.Primary,
            tag: imageTags.Primary
        });
    }

    if (item?.AlbumPrimaryImageTag && item.AlbumId) {
        return apiClient.getScaledImageUrl(item.AlbumId, {
            maxWidth: Math.round(dom.getScreenWidth() * 0.2),
            type: ImageType.Primary,
            tag: item.AlbumPrimaryImageTag
        });
    }

    return null;
};

export default getNowPlayingImageUrl;
