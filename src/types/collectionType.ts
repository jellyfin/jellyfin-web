// NOTE: This should be included in the OpenAPI spec ideally
// https://github.com/jellyfin/jellyfin/blob/47290a8c3665f3adb859bda19deb66f438f2e5d0/MediaBrowser.Model/Entities/CollectionType.cs
export enum CollectionType {
    Movies = 'movies',
    TvShows = 'tvshows',
    Music = 'music',
    MusicVideos = 'musicvideos',
    Trailers = 'trailers',
    HomeVideos = 'homevideos',
    BoxSets = 'boxsets',
    Books = 'books',
    Photos = 'photos',
    LiveTv = 'livetv',
    Playlists = 'playlists',
    Folders = 'folders'
}
