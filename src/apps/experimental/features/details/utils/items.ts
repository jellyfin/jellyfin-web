
import type { Api } from '@jellyfin/sdk';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { getImageApi } from '@jellyfin/sdk/lib/utils/api/image-api';
import { playbackManager } from 'components/playback/playbackmanager';
import datetime from 'scripts/datetime';
import globalize from 'scripts/globalize';
import { randomInt } from 'utils/number';

import type { ItemDto } from 'types/base/models/item-dto';

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
    random = false,
    scaleImageOpts: ScaleImageOptions
) {
    let imgType;
    let imgTag;
    let itemId;
    let imgIndex;

    if (item.Id && item.BackdropImageTags?.length) {
        const backdropImgIndex = random ?
            randomInt(0, item.BackdropImageTags.length - 1) :
            0;
        imgType = ImageType.Backdrop;
        imgIndex = backdropImgIndex;
        imgTag = item.BackdropImageTags[backdropImgIndex];
        itemId = item.Id;
    } else if (
        item.ParentBackdropItemId
        && item.ParentBackdropImageTags?.length
    ) {
        const backdropImgIndex = random ?
            randomInt(0, item.ParentBackdropImageTags.length - 1) :
            0;
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

export function canResume(PlaybackPositionTicks: number | undefined): boolean {
    return Boolean(
        PlaybackPositionTicks
            && PlaybackPositionTicks > 0
    );
}

export function getCanPlay(item: ItemDto | undefined) {
    let canPlay = false;
    let isResumable = false;
    let canInstantMix = false;
    let canShuffle = false;
    const btnPlayTitle = globalize.translate('Play');

    if (item?.Type == 'Program') {
        const now = new Date();

        if (
            now >= datetime.parseISO8601Date(item.StartDate, true)
            && now < datetime.parseISO8601Date(item.EndDate, true)
        ) {
            canPlay = true;
        } else {
            canPlay = false;
        }
        isResumable = false;
        canInstantMix = false;
        canShuffle = false;
    } else if (playbackManager.canPlay(item)) {
        const enableInstantMix =
            ['Audio', 'MusicAlbum', 'MusicGenre', 'MusicArtist'].indexOf(
                item?.Type || ''
            ) !== -1;
        canInstantMix = enableInstantMix;
        const enableShuffle =
            item?.IsFolder
            || ['MusicAlbum', 'MusicGenre', 'MusicArtist'].indexOf(
                item?.Type || ''
            ) !== -1;
        canShuffle = enableShuffle;
        canPlay = true;
        const playbackPositionTicks = item?.UserData?.PlaybackPositionTicks;
        isResumable = canResume(playbackPositionTicks);
    } else {
        canPlay = false;
        isResumable = false;
        canInstantMix = false;
        canShuffle = false;
    }

    return {
        canPlay,
        isResumable,
        canInstantMix,
        canShuffle,
        btnPlayTitle
    };
}
