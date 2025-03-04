import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client';

export const SEARCH_SECTIONS_SORT_ORDER: BaseItemKind[] = [
    BaseItemKind.Movie,
    BaseItemKind.Series,
    BaseItemKind.Episode,
    BaseItemKind.Person,
    BaseItemKind.Playlist,
    BaseItemKind.MusicArtist,
    BaseItemKind.MusicAlbum,
    BaseItemKind.Audio,
    BaseItemKind.Video,
    BaseItemKind.LiveTvProgram,
    BaseItemKind.TvChannel,
    BaseItemKind.PhotoAlbum,
    BaseItemKind.Photo,
    BaseItemKind.AudioBook,
    BaseItemKind.Book,
    BaseItemKind.BoxSet
];
