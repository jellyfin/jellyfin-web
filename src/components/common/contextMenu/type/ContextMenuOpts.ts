import type { NullableString } from 'types/base/common/shared/types';

export interface ContextMenuOpts {
    open?: boolean;
    play?: boolean;
    playAllFromHere?: boolean;
    queueAllFromHere?: boolean;
    cancelTimer?: boolean;
    record?: boolean;
    deleteItem?: boolean;
    shuffle?: boolean;
    instantMix?: boolean;
    share?: boolean;
    stopPlayback?: boolean;
    clearQueue?: boolean;
    queue?: boolean;
    playlist?: boolean;
    edit?: boolean;
    editImages?: boolean;
    editSubtitles?: boolean;
    identify?: boolean;
    moremediainfo?: boolean;
    openAlbum?: boolean;
    openArtist?: boolean;
    openLyrics?: boolean;
    collectionId?: NullableString;
    playlistId?: NullableString;
    canEditPlaylist?: boolean;
    playlistItemId?: NullableString;
}
