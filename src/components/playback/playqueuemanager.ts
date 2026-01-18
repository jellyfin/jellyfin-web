interface PlaylistItem {
    PlaylistItemId?: string;
    Id?: string;
    Name?: string;
    [key: string]: any; // Allow additional properties
}

let currentId = 0;

function addUniquePlaylistItemId(item: PlaylistItem): void {
    if (!item.PlaylistItemId) {
        item.PlaylistItemId = 'playlistItem' + currentId;
        currentId++;
    }
}

function findPlaylistIndex(playlistItemId: string, list: PlaylistItem[]): number {
    for (let i = 0, length = list.length; i < length; i++) {
        if (list[i].PlaylistItemId === playlistItemId) {
            return i;
        }
    }

    return -1;
}

type RepeatMode = 'RepeatNone' | 'RepeatAll' | 'RepeatOne';
type ShuffleMode = 'Sorted' | 'Shuffle';

class PlayQueueManager {
    private _sortedPlaylist: PlaylistItem[] = [];
    private _playlist: PlaylistItem[] = [];
    private _repeatMode: RepeatMode = 'RepeatNone';
    private _shuffleMode: ShuffleMode = 'Sorted';
    private _currentPlaylistItemId: string | null = null;

    getPlaylist(): PlaylistItem[] {
        return this._playlist.slice(0);
    }

    setPlaylist(items: PlaylistItem[]): void {
        items = items.slice(0);

        for (let i = 0, length = items.length; i < length; i++) {
            addUniquePlaylistItemId(items[i]);
        }

        this._currentPlaylistItemId = null;
        this._playlist = items;
        this._repeatMode = 'RepeatNone';
    }

    queue(items: PlaylistItem[]): void {
        for (let i = 0, length = items.length; i < length; i++) {
            addUniquePlaylistItemId(items[i]);

            this._playlist.push(items[i]);
        }
    }

    queueNext(items: PlaylistItem[]): void {
        const currentIndex = this.getCurrentPlaylistIndex();

        if (currentIndex === -1) {
            this.queue(items);
            return;
        }

        for (let i = 0, length = items.length; i < length; i++) {
            addUniquePlaylistItemId(items[i]);
        }

        // Insert after current item
        this._playlist.splice(currentIndex + 1, 0, ...items);
    }

    removeFromPlaylist(playlistItemIds: string[]): void {
        const currentItem = this.getCurrentPlaylistItem();

        this._playlist = this._playlist.filter(item =>
            !playlistItemIds.includes(item.PlaylistItemId!)
        );

        if (currentItem && !this._playlist.find(item => item.PlaylistItemId === currentItem.PlaylistItemId)) {
            // Current item was removed, clear it
            this._currentPlaylistItemId = null;
        }
    }

    movePlaylistItem(playlistItemId: string, newIndex: number): void {
        const currentIndex = findPlaylistIndex(playlistItemId, this._playlist);

        if (currentIndex === -1) {
            return;
        }

        const item = this._playlist.splice(currentIndex, 1)[0];
        this._playlist.splice(newIndex, 0, item);
    }

    getCurrentPlaylistIndex(): number {
        if (!this._currentPlaylistItemId) {
            return -1;
        }

        return findPlaylistIndex(this._currentPlaylistItemId, this._playlist);
    }

    getCurrentPlaylistItemId(): string | null {
        return this._currentPlaylistItemId;
    }

    setCurrentPlaylistItem(playlistItemId: string): void {
        this._currentPlaylistItemId = playlistItemId;
    }

    getCurrentPlaylistItem(): PlaylistItem | null {
        const index = this.getCurrentPlaylistIndex();
        return index === -1 ? null : this._playlist[index];
    }

    getRepeatMode(): RepeatMode {
        return this._repeatMode;
    }

    setRepeatMode(mode: RepeatMode): void {
        this._repeatMode = mode;
    }

    getShuffleMode(): ShuffleMode {
        return this._shuffleMode;
    }

    setShuffleMode(mode: ShuffleMode): void {
        this._shuffleMode = mode;
        this.updateSortedPlaylist();
    }

    private updateSortedPlaylist(): void {
        if (this._shuffleMode === 'Shuffle') {
            this._sortedPlaylist = this.shuffleArray(this._playlist.slice());
        } else {
            this._sortedPlaylist = this._playlist.slice();
        }
    }

    private shuffleArray(array: PlaylistItem[]): PlaylistItem[] {
        const shuffled = array.slice();
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    getNextItem(): PlaylistItem | null {
        const currentIndex = this.getCurrentPlaylistIndex();

        if (currentIndex === -1) {
            return this._playlist.length > 0 ? this._playlist[0] : null;
        }

        if (this._repeatMode === 'RepeatOne') {
            return this._playlist[currentIndex];
        }

        const nextIndex = currentIndex + 1;

        if (nextIndex < this._playlist.length) {
            return this._playlist[nextIndex];
        }

        if (this._repeatMode === 'RepeatAll') {
            return this._playlist[0];
        }

        return null;
    }

    getPreviousItem(): PlaylistItem | null {
        const currentIndex = this.getCurrentPlaylistIndex();

        if (currentIndex === -1) {
            return this._playlist.length > 0 ? this._playlist[this._playlist.length - 1] : null;
        }

        if (this._repeatMode === 'RepeatOne') {
            return this._playlist[currentIndex];
        }

        const prevIndex = currentIndex - 1;

        if (prevIndex >= 0) {
            return this._playlist[prevIndex];
        }

        if (this._repeatMode === 'RepeatAll') {
            return this._playlist[this._playlist.length - 1];
        }

        return null;
    }
}

export default PlayQueueManager;