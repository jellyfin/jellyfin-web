export const ItemMediaKind = {
    MusicArtist: 'MusicArtist',
    Playlist: 'Playlist',
    MusicGenre: 'MusicGenre',
    Photo: 'Photo',
    Audio: 'Audio',
    Video: 'Video',
    Book: 'Book',
    Recording: 'Recording'
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type ItemMediaKind = keyof typeof ItemMediaKind;

export type ItemMediaType = ItemMediaKind | null | undefined;
