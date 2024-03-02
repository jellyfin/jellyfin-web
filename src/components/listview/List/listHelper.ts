import { Api } from '@jellyfin/sdk';
import { BaseItemKind, ImageType } from '@jellyfin/sdk/lib/generated-client';
import { getImageApi } from '@jellyfin/sdk/lib/utils/api/image-api';
import globalize from 'scripts/globalize';

import type { ItemDto } from 'types/base/models/item-dto';
import type { ListOptions } from 'types/listOptions';

const sortBySortName = (item: ItemDto): string => {
    if (item.Type === BaseItemKind.Episode) {
        return '';
    }

    // SortName
    const name = (item.SortName ?? item.Name ?? '?')[0].toUpperCase();

    const code = name.charCodeAt(0);
    if (code < 65 || code > 90) {
        return '#';
    }

    return name.toUpperCase();
};

const sortByOfficialrating = (item: ItemDto): string => {
    return item.OfficialRating ?? globalize.translate('Unrated');
};

const sortByCommunityRating = (item: ItemDto): string => {
    if (item.CommunityRating == null) {
        return globalize.translate('Unrated');
    }

    return String(Math.floor(item.CommunityRating));
};

const sortByCriticRating = (item: ItemDto): string => {
    if (item.CriticRating == null) {
        return globalize.translate('Unrated');
    }

    return String(Math.floor(item.CriticRating));
};

const sortByAlbumArtist = (item: ItemDto): string => {
    // SortName
    if (!item.AlbumArtist) {
        return '';
    }

    const name = item.AlbumArtist[0].toUpperCase();

    const code = name.charCodeAt(0);
    if (code < 65 || code > 90) {
        return '#';
    }

    return name.toUpperCase();
};

export function getIndex(item: ItemDto, listOptions: ListOptions): string {
    if (listOptions.index === 'disc') {
        return item.ParentIndexNumber == null ?
            '' :
            globalize.translate('ValueDiscNumber', item.ParentIndexNumber);
    }

    const sortBy = (listOptions.sortBy ?? '').toLowerCase();

    if (sortBy.startsWith('sortname')) {
        return sortBySortName(item);
    }
    if (sortBy.startsWith('officialrating')) {
        return sortByOfficialrating(item);
    }
    if (sortBy.startsWith('communityrating')) {
        return sortByCommunityRating(item);
    }
    if (sortBy.startsWith('criticrating')) {
        return sortByCriticRating(item);
    }
    if (sortBy.startsWith('albumartist')) {
        return sortByAlbumArtist(item);
    }
    return '';
}

export function getImageUrl(
    item: ItemDto,
    api: Api | undefined,
    size: number | undefined
) {
    let imgTag;
    let itemId;
    const fillWidth = size;
    const fillHeight = size;
    const imgType = ImageType.Primary;

    if (item.ImageTags?.Primary) {
        imgTag = item.ImageTags.Primary;
        itemId = item.Id;
    } else if (item.AlbumId && item.AlbumPrimaryImageTag) {
        imgTag = item.AlbumPrimaryImageTag;
        itemId = item.AlbumId;
    } else if (item.SeriesId && item.SeriesPrimaryImageTag) {
        imgTag = item.SeriesPrimaryImageTag;
        itemId = item.SeriesId;
    } else if (item.ParentPrimaryImageTag) {
        imgTag = item.ParentPrimaryImageTag;
        itemId = item.ParentPrimaryImageItemId;
    }

    if (api && imgTag && imgType && itemId) {
        const response = getImageApi(api).getItemImageUrlById(itemId, imgType, {
            fillWidth: fillWidth,
            fillHeight: fillHeight,
            tag: imgTag
        });

        return {
            imgUrl: response,
            blurhash: item.ImageBlurHashes?.[imgType]?.[imgTag]
        };
    }

    return {
        imgUrl: undefined,
        blurhash: undefined
    };
}

export function getChannelImageUrl(
    item: ItemDto,
    api: Api | undefined,
    size: number | undefined
) {
    let imgTag;
    let itemId;
    const fillWidth = size;
    const fillHeight = size;
    const imgType = ImageType.Primary;

    if (item.ChannelId && item.ChannelPrimaryImageTag) {
        imgTag = item.ChannelPrimaryImageTag;
        itemId = item.ChannelId;
    }

    if (api && imgTag && imgType && itemId) {
        const response = api.getItemImageUrl(itemId, imgType, {
            fillWidth: fillWidth,
            fillHeight: fillHeight,
            tag: imgTag
        });

        return {
            imgUrl: response,
            blurhash: item.ImageBlurHashes?.[imgType]?.[imgTag]
        };
    }

    return {
        imgUrl: undefined,
        blurhash: undefined
    };
}

export function canResume(PlaybackPositionTicks: number | undefined): boolean {
    return Boolean(
        PlaybackPositionTicks
            && PlaybackPositionTicks > 0
    );
}
