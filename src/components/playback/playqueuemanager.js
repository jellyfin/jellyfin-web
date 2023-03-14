import { randomInt } from '../../utils/number.ts';

let currentId = 0;
function addUniquePlaylistItemId(item) {
    if (!item.PlaylistItemId) {
        item.PlaylistItemId = 'playlistItem' + currentId;
        currentId++;
    }
}

function findPlaylistIndex(playlistItemId, list) {
    for (let i = 0, length = list.length; i < length; i++) {
        if (list[i].PlaylistItemId === playlistItemId) {
            return i;
        }
    }

    return -1;
}

class PlayQueueManager {
    constructor() {
        this._sortedPlaylist = [];
        this._playlist = [];
        this._repeatMode = 'RepeatNone';
        this._shuffleMode = 'Sorted';
    }

    getPlaylist() {
        return this._playlist.slice(0);
    }

    setPlaylist(items) {
        items = items.slice(0);

        for (let i = 0, length = items.length; i < length; i++) {
            addUniquePlaylistItemId(items[i]);
        }

        this._currentPlaylistItemId = null;
        this._playlist = items;
        this._repeatMode = 'RepeatNone';
    }

    queue(items) {
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

    queueNext(items) {
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

    setPlaylistState(playlistItemId) {
        this._currentPlaylistItemId = playlistItemId;
    }

    setPlaylistIndex(playlistIndex) {
        if (playlistIndex < 0) {
            this.setPlaylistState(null);
        } else {
            this.setPlaylistState(this._playlist[playlistIndex].PlaylistItemId);
        }
    }

    removeFromPlaylist(playlistItemIds) {
        if (this._playlist.length <= playlistItemIds.length) {
            return {
                result: 'empty'
            };
        }

        const currentPlaylistItemId = this.getCurrentPlaylistItemId();
        const isCurrentIndex = playlistItemIds.indexOf(currentPlaylistItemId) !== -1;

        this._sortedPlaylist = this._sortedPlaylist.filter(function (item) {
            return !playlistItemIds.includes(item.PlaylistItemId);
        });

        this._playlist = this._playlist.filter(function (item) {
            return !playlistItemIds.includes(item.PlaylistItemId);
        });

        return {
            result: 'removed',
            isCurrentIndex: isCurrentIndex
        };
    }

    movePlaylistItem(playlistItemId, newIndex) {
        const playlist = this.getPlaylist();

        let oldIndex;
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

        moveInArray(playlist, oldIndex, newIndex);

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

    setRepeatMode(value) {
        const repeatModes = ['RepeatOne', 'RepeatAll', 'RepeatNone'];
        if (repeatModes.includes(value)) {
            this._repeatMode = value;
        } else {
            throw new TypeError('invalid value provided for setRepeatMode');
        }
    }

    getRepeatMode() {
        return this._repeatMode;
    }

    setShuffleMode(value) {
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

    getNextItemInfo() {
        let newIndex;
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

function arrayInsertAt(destArray, pos, arrayToInsert) {
    let args = [];
    args.push(pos); // where to insert
    args.push(0); // nothing to remove
    args = args.concat(arrayToInsert); // add on array to insert
    destArray.splice.apply(destArray, args); // splice it in
}

function moveInArray(array, from, to) {
    array.splice(to, 0, array.splice(from, 1)[0]);
}

export default PlayQueueManager;
