import type { Api } from '@jellyfin/sdk';
import { MediaSourceType } from '@jellyfin/sdk/lib/generated-client/models/media-source-type';
import { MediaStreamType } from '@jellyfin/sdk/lib/generated-client/models/media-stream-type';
import type { MediaSourceInfo } from '@jellyfin/sdk/lib/generated-client/models/media-source-info';
import type { MediaStream } from '@jellyfin/sdk/lib/generated-client/models/media-stream';
import type { DayOfWeek } from '@jellyfin/sdk/lib/generated-client/models/day-of-week';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { getImageApi } from '@jellyfin/sdk/lib/utils/api/image-api';
import { playbackManager } from 'components/playback/playbackmanager';
import itemHelper from 'components/itemHelper';
import datetime from 'scripts/datetime';
import { randomInt } from 'utils/number';

import { ItemKind } from 'types/base/models/item-kind';
import { ItemStatus } from 'types/base/models/item-status';
import type { ItemDto } from 'types/base/models/item-dto';
import type {
    NullableBoolean,
    NullableNumber,
    NullableString
} from 'types/base/common/shared/types';

export interface ScaleImageOptions {
    maxWidth?: number;
    width?: number;
    maxHeight?: number;
    height?: number;
    fillWidth?: number;
    fillHeight?: number;
    quality?: number;
}

export function getItemBackdropImageUrl(
    item: ItemDto,
    api: Api | undefined,
    random: boolean,
    scaleImageOpts: ScaleImageOptions
) {
    let imgType;
    let imgTag;
    let itemId;
    let imgIndex;

    if (item.Id && item.BackdropImageTags?.length) {
        const backdropImgIndex = random ? randomInt(0, item.BackdropImageTags.length - 1) : 0;
        imgType = ImageType.Backdrop;
        imgIndex = backdropImgIndex;
        imgTag = item.BackdropImageTags[backdropImgIndex];
        itemId = item.Id;
    } else if (
        item.ParentBackdropItemId
        && item.ParentBackdropImageTags?.length
    ) {
        const backdropImgIndex = random ? randomInt(0, item.ParentBackdropImageTags.length - 1) : 0;
        imgType = ImageType.Backdrop;
        imgIndex = backdropImgIndex;
        imgTag = item.ParentBackdropImageTags[backdropImgIndex];
        itemId = item.ParentBackdropItemId;
    } else if (item.ImageTags?.Primary) {
        imgType = ImageType.Primary;
        imgTag = item.ImageTags.Primary;
        itemId = item.Id;
    }

    if (!itemId) {
        itemId = item.Id;
    }

    if (api && imgTag && imgType && itemId) {
        const response = getImageApi(api).getItemImageUrlById(itemId, imgType, {
            ...scaleImageOpts,
            imageIndex: imgIndex
        });

        return {
            imgUrl: response,
            blurhash: item?.ImageBlurHashes?.[imgType]?.[imgTag]
        };
    }

    return {
        imgUrl: undefined,
        blurhash: undefined
    };
}

export function hasChildItems(itemChildCount: NullableNumber): boolean {
    return !!itemChildCount;
}

export function canResume(PlaybackPositionTicks: number | undefined): boolean {
    return !!(PlaybackPositionTicks && PlaybackPositionTicks > 0);
}

export function canInstantMix(itemType: ItemKind): boolean {
    return !!(
        itemType === ItemKind.Audio
        || itemType === ItemKind.MusicAlbum
        || itemType === ItemKind.MusicArtist
        || itemType === ItemKind.MusicGenre
    );
}

export function canShuffle(
    itemType: ItemKind,
    itemIsFolder: NullableBoolean
): boolean {
    return !!(
        itemIsFolder
        || itemType === ItemKind.MusicAlbum
        || itemType === ItemKind.MusicArtist
        || itemType === ItemKind.MusicGenre
    );
}

export function getPlaybackCapabilities(item: ItemDto) {
    let isPlayAllowed = false;
    let isResumeAllowed = false;
    let isInstantMixAllowed = false;
    let isShuffleAllowed = false;

    if (item.Type == ItemKind.Program) {
        const now = new Date();

        if (
            now >= datetime.parseISO8601Date(item.StartDate, true)
            && now < datetime.parseISO8601Date(item.EndDate, true)
        ) {
            isPlayAllowed = true;
        }
    } else if (playbackManager.canPlay(item)) {
        isInstantMixAllowed = canInstantMix(item.Type);
        isShuffleAllowed =
            item.Type === ItemKind.BoxSet ?
                hasChildItems(item.ChildCount) :
                canShuffle(item.Type, item.IsFolder);
        isResumeAllowed = canResume(item?.UserData?.PlaybackPositionTicks);
        isPlayAllowed =
            item.Type === ItemKind.BoxSet ?
                hasChildItems(item.ChildCount) :
                true;
    }

    return {
        isPlayAllowed,
        isResumeAllowed,
        isInstantMixAllowed,
        isShuffleAllowed
    };
}

export const getSeriesAirTime = (
    itemType: ItemKind,
    itemAirDays: DayOfWeek[] | null,
    itemAirTime: NullableString,
    itemStatus: ItemStatus
) => {
    let airTimeText;
    if (itemType === ItemKind.Series) {
        if (itemAirDays?.length) {
            if (itemAirDays.length === 7) {
                airTimeText = 'daily';
            } else {
                airTimeText = itemAirDays.map((a) => a + 's').join(',');
            }
        }
        if (itemAirTime) {
            airTimeText += ' at ' + itemAirTime;
        }
        if (airTimeText) {
            airTimeText =
                (itemStatus === ItemStatus.Ended ? 'Aired ' : 'Airs ')
                + airTimeText;
        }
    }
    return airTimeText;
};

export const getFilteredMediaStreams = (
    mediaStreams: MediaStream[],
    mediaStreamType: MediaStreamType,
    sort = true
): MediaStream[] => {
    const filtered = mediaStreams.filter((m) => m.Type === mediaStreamType);
    return sort ? filtered?.sort(itemHelper.sortTracks) : filtered;
};

export const getFilteredMediaSources = (
    mediaSources: MediaSourceInfo[],
    mediaSourceType: MediaSourceType
): MediaSourceInfo[] => {
    return mediaSources.filter((m) => m.Type === mediaSourceType);
};
