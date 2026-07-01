import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';

import { ServerConnections } from 'lib/jellyfin-apiclient';
import type { ItemDto } from 'types/base/models/item-dto';

interface ImageOptions {
    height?: number
    maxHeight?: number
    tag?: string
    type?: ImageType
}

function getSeriesImageUrl(item: ItemDto, options: ImageOptions = {}) {
    if (!item.ServerId) return null;

    const apiClient = ServerConnections.getApiClient(item.ServerId);
    if (!apiClient) {
        console.error('[getSeriesImageUrl] No ApiClient instance available for serverId', item.ServerId);
        return null;
    }

    if (item.SeriesId && options.type === ImageType.Primary && item.SeriesPrimaryImageTag) {
        options.tag = item.SeriesPrimaryImageTag;

        return apiClient.getScaledImageUrl(item.SeriesId, options);
    }

    if (options.type === ImageType.Thumb) {
        if (item.SeriesId && item.SeriesThumbImageTag) {
            options.tag = item.SeriesThumbImageTag;

            return apiClient.getScaledImageUrl(item.SeriesId, options);
        }

        if (item.ParentThumbItemId && item.ParentThumbImageTag) {
            options.tag = item.ParentThumbImageTag;

            return apiClient.getScaledImageUrl(item.ParentThumbItemId, options);
        }
    }

    return null;
}

export function getImageUrl(item: ItemDto, options: ImageOptions = {}) {
    if (!item.ServerId) return null;

    const apiClient = ServerConnections.getApiClient(item.ServerId);
    if (!apiClient) {
        console.error('[getImageUrl] No ApiClient instance available for serverId', item.ServerId);
        return null;
    }

    options.type = options.type || ImageType.Primary;

    if (item.Type === BaseItemKind.Episode) return getSeriesImageUrl(item, options);

    const itemId = item.PrimaryImageItemId || item.Id;

    if (itemId && item.ImageTags?.[options.type]) {
        options.tag = item.ImageTags[options.type] ?? undefined;
        return apiClient.getScaledImageUrl(itemId, options);
    }

    if (item.AlbumId && item.AlbumPrimaryImageTag) {
        options.tag = item.AlbumPrimaryImageTag;
        return apiClient.getScaledImageUrl(item.AlbumId, options);
    }

    return null;
}
