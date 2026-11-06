import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import type { GroupRepeatMode } from '@jellyfin/sdk/lib/generated-client/models/group-repeat-mode';
import type { GroupShuffleMode } from '@jellyfin/sdk/lib/generated-client/models/group-shuffle-mode';

import { randomInt } from '@/utils/number';

export type RemoveFromPlaylistResult =
    | { result: 'empty' }
    | { result: 'removed'; isCurrentIndex: boolean };

export type MovePlaylistItemResult =
    | { result: 'noop' }
    | { result: 'moved'; playlistItemId: string; newIndex: number };

export interface NextItemInfo {
    item: BaseItemDto;
    index: number;
}

let currentId = 0;
function addUniquePlaylistItemId(item: BaseItemDto) {
    if (!item.PlaylistItemId) {
        item.PlaylistItemId = 'playlistItem' + currentId;
        currentId++;
    }
}

function findPlaylistIndex(playlistItemId: string | null | undefined, list: BaseItemDto[]) {
    for (let i = 0, length = list.length; i < length; i++) {
        if (list[i].PlaylistItemId === playlistItemId) {
            return i;
        }
    }

    return -1;
}

class PlayQueueManager {
    private _sortedPlaylist: BaseItemDto[];
    private _playlist: BaseItemDto[];
    private _repeatMode: GroupRepeatMode;
    private _shuffleMode: GroupShuffleMode;
    private _currentPlaylistItemId?: string | null;

    constructor() {
        this._sortedPlaylist = [];
        this._playlist = [];
        this._repeatMode = 'RepeatNone';
        this._shuffleMode = 'Sorted';
    }

    getPlaylist() {
        return this._playlist.slice(0);
    }

    setPlaylist(items: BaseItemDto[]) {
        items = items.slice(0);

        for (let i = 0, length = items.length; i < length; i++) {
            addUniquePlaylistItemId(items[i]);
        }

        this._currentPlaylistItemId = null;
        this._playlist = items;
        this._repeatMode = 'RepeatNone';
    }

    queue(items: BaseItemDto[]) {
        for (let i = 0, length = items.length; i < length; i++) {
            addUniquePlaylistItemId(items[i]);

            this._playlist.push(items[i]);
        }
    }

    shufflePlaylist() {
        this._sortedPlaylist = [];
        for (const item of this._playlist) {
            this._sortedPlaylist.push(item);
        }
        const currentPlaylistItem = this._playlist.splice(this.getCurrentPlaylistIndex(), 1)[0];

        for (let i = this._playlist.length - 1; i > 0; i--) {
            const j = randomInt(0, i - 1);
            const temp = this._playlist[i];
            this._playlist[i] = this._playlist[j];
            this._playlist[j] = temp;
        }
        this._playlist.unshift(currentPlaylistItem);
        this._shuffleMode = 'Shuffle';
    }

    sortShuffledPlaylist() {
        this._playlist = [];
        for (const item of this._sortedPlaylist) {
            this._playlist.push(item);
        }
        this._sortedPlaylist = [];
        this._shuffleMode = 'Sorted';
    }

    clearPlaylist(clearCurrentItem = false) {
        const currentPlaylistItem = this._playlist.splice(this.getCurrentPlaylistIndex(), 1)[0];
        this._playlist = [];
        if (!clearCurrentItem) {
            this._playlist.push(currentPlaylistItem);
        }
    }

    queueNext(items: BaseItemDto[]) {
        for (let i = 0, length = items.length; i < length; i++) {
            addUniquePlaylistItemId(items[i]);
        }

        let currentIndex = this.getCurrentPlaylistIndex();

        if (currentIndex === -1) {
            currentIndex = this._playlist.length;
        } else {
            currentIndex++;
        }

        arrayInsertAt(this._playlist, currentIndex, items);
    }

    getCurrentPlaylistIndex() {
        return findPlaylistIndex(this.getCurrentPlaylistItemId(), this._playlist);
    }

    getCurrentItem() {
        const index = findPlaylistIndex(this.getCurrentPlaylistItemId(), this._playlist);

        return index === -1 ? null : this._playlist[index];
    }

    getCurrentPlaylistItemId() {
        return this._currentPlaylistItemId;
    }

    setPlaylistState(playlistItemId: string | null | undefined) {
        this._currentPlaylistItemId = playlistItemId;
    }

    setPlaylistIndex(playlistIndex: number) {
        if (playlistIndex < 0) {
            this.setPlaylistState(null);
        } else {
            this.setPlaylistState(this._playlist[playlistIndex].PlaylistItemId);
        }
    }

    removeFromPlaylist(playlistItemIds: string[]): RemoveFromPlaylistResult {
        if (this._playlist.length <= playlistItemIds.length) {
            return {
                result: 'empty'
            };
        }

        // Widened so the nullable playlist item ids below can be looked up
        const ids: ReadonlyArray<string | null | undefined> = playlistItemIds;

        const currentPlaylistItemId = this.getCurrentPlaylistItemId();
        const isCurrentIndex = ids.indexOf(currentPlaylistItemId) !== -1;

        this._sortedPlaylist = this._sortedPlaylist.filter(function (item) {
            return !ids.includes(item.PlaylistItemId);
        });

        this._playlist = this._playlist.filter(function (item) {
            return !ids.includes(item.PlaylistItemId);
        });

        return {
            result: 'removed',
            isCurrentIndex: isCurrentIndex
        };
    }

    movePlaylistItem(playlistItemId: string, newIndex: number): MovePlaylistItemResult {
        const playlist = this.getPlaylist();

        let oldIndex: number | undefined;
        for (let i = 0, length = playlist.length; i < length; i++) {
            if (playlist[i].PlaylistItemId === playlistItemId) {
                oldIndex = i;
                break;
            }
        }

        if (oldIndex === -1 || oldIndex === newIndex) {
            return {
                result: 'noop'
            };
        }

        if (newIndex >= playlist.length) {
            throw new Error('newIndex out of bounds');
        }

        // NOTE: oldIndex is undefined when the item is not found, which splice treats as 0
        moveInArray(playlist, oldIndex ?? 0, newIndex);

        this._playlist = playlist;

        return {
            result: 'moved',
            playlistItemId: playlistItemId,
            newIndex: newIndex
        };
    }

    reset() {
        this._sortedPlaylist = [];
        this._playlist = [];
        this._currentPlaylistItemId = null;
        this._repeatMode = 'RepeatNone';
        this._shuffleMode = 'Sorted';
    }

    setRepeatMode(value: GroupRepeatMode) {
        const repeatModes: GroupRepeatMode[] = ['RepeatOne', 'RepeatAll', 'RepeatNone'];
        if (repeatModes.includes(value)) {
            this._repeatMode = value;
        } else {
            throw new TypeError('invalid value provided for setRepeatMode');
        }
    }

    getRepeatMode() {
        return this._repeatMode;
    }

    setShuffleMode(value: GroupShuffleMode) {
        switch (value) {
            case 'Shuffle':
                this.shufflePlaylist();
                break;
            case 'Sorted':
                this.sortShuffledPlaylist();
                break;
            default:
                throw new TypeError('invalid value provided to setShuffleMode');
        }
    }

    toggleShuffleMode() {
        switch (this._shuffleMode) {
            case 'Shuffle':
                this.setShuffleMode('Sorted');
                break;
            case 'Sorted':
                this.setShuffleMode('Shuffle');
                break;
            default:
                throw new TypeError('current value for shufflequeue is invalid');
        }
    }

    getShuffleMode() {
        return this._shuffleMode;
    }

    getNextItemInfo(): NextItemInfo | null {
        let newIndex: number;
        const playlist = this.getPlaylist();
        const playlistLength = playlist.length;

        switch (this.getRepeatMode()) {
            case 'RepeatOne':
                newIndex = this.getCurrentPlaylistIndex();
                break;
            case 'RepeatAll':
                newIndex = this.getCurrentPlaylistIndex() + 1;
                if (newIndex >= playlistLength) {
                    newIndex = 0;
                }
                break;
            default:
                newIndex = this.getCurrentPlaylistIndex() + 1;
                break;
        }

        if (newIndex < 0 || newIndex >= playlistLength) {
            return null;
        }

        const item = playlist[newIndex];

        if (!item) {
            return null;
        }

        return {
            item: item,
            index: newIndex
        };
    }
}

function arrayInsertAt<T>(destArray: T[], pos: number, arrayToInsert: T[]) {
    // insert at pos, removing nothing
    destArray.splice(pos, 0, ...arrayToInsert);
}

function moveInArray<T>(array: T[], from: number, to: number) {
    array.splice(to, 0, array.splice(from, 1)[0]);
}

export default PlayQueueManager;
