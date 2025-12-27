import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';

import { ServerConnections } from '@/lib/jellyfin-apiclient';
import type { ItemDto } from '@/types/base/models/item-dto';

interface ImageOptions {
    height?: number
    maxHeight?: number
    tag?: string
    type?: ImageType
}

function getSeriesImageUrl(item: ItemDto, options: ImageOptions = {}) {
    if (!item.ServerId) return null;

    if (item.SeriesId && options.type === ImageType.Primary && item.SeriesPrimaryImageTag) {
        options.tag = item.SeriesPrimaryImageTag;

        return ServerConnections.getApiClient(item.ServerId).getScaledImageUrl(item.SeriesId, options);
    }

    if (options.type === ImageType.Thumb) {
        if (item.SeriesId && item.SeriesThumbImageTag) {
            options.tag = item.SeriesThumbImageTag;

            return ServerConnections.getApiClient(item.ServerId).getScaledImageUrl(item.SeriesId, options);
        }

        if (item.ParentThumbItemId && item.ParentThumbImageTag) {
            options.tag = item.ParentThumbImageTag;

            return ServerConnections.getApiClient(item.ServerId).getScaledImageUrl(item.ParentThumbItemId, options);
        }
    }

    return null;
}

export function getImageUrl(item: ItemDto, options: ImageOptions = {}) {
    if (!item.ServerId) return null;

    options.type = options.type || ImageType.Primary;

    if (item.Type === BaseItemKind.Episode) return getSeriesImageUrl(item, options);

    const itemId = item.PrimaryImageItemId || item.Id;

    if (itemId && item.ImageTags?.[options.type]) {
        options.tag = item.ImageTags[options.type];
        return ServerConnections.getApiClient(item.ServerId).getScaledImageUrl(itemId, options);
    }

    if (item.AlbumId && item.AlbumPrimaryImageTag) {
        options.tag = item.AlbumPrimaryImageTag;
        return ServerConnections.getApiClient(item.ServerId).getScaledImageUrl(item.AlbumId, options);
    }

    return null;
}
