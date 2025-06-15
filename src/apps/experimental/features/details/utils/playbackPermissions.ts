import { playbackManager } from 'components/playback/playbackmanager';
import datetime from 'scripts/datetime';

import { ItemKind } from 'types/base/models/item-kind';
import type { ItemDto } from 'types/base/models/item-dto';
import type {
    NullableBoolean,
    NullableNumber
} from 'types/base/common/shared/types';

function hasChildItems(itemChildCount: NullableNumber): boolean {
    return !!itemChildCount;
}

function canResume(PlaybackPositionTicks: number | undefined): boolean {
    return !!(PlaybackPositionTicks && PlaybackPositionTicks > 0);
}

function canInstantMix(itemType: ItemKind): boolean {
    return !!(
        itemType === ItemKind.Audio
        || itemType === ItemKind.MusicAlbum
        || itemType === ItemKind.MusicArtist
        || itemType === ItemKind.MusicGenre
    );
}

function canShuffle(
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

export function getPlaybackPermissions(item: ItemDto) {
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
