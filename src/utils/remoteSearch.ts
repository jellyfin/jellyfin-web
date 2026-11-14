import type { Api } from '@jellyfin/sdk/lib/api';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import type { AlbumInfoRemoteSearchQuery } from '@jellyfin/sdk/lib/generated-client/models/album-info-remote-search-query';
import type { ArtistInfoRemoteSearchQuery } from '@jellyfin/sdk/lib/generated-client/models/artist-info-remote-search-query';
import type { BookInfoRemoteSearchQuery } from '@jellyfin/sdk/lib/generated-client/models/book-info-remote-search-query';
import type { BoxSetInfoRemoteSearchQuery } from '@jellyfin/sdk/lib/generated-client/models/box-set-info-remote-search-query';
import type { MovieInfoRemoteSearchQuery } from '@jellyfin/sdk/lib/generated-client/models/movie-info-remote-search-query';
import type { MusicVideoInfoRemoteSearchQuery } from '@jellyfin/sdk/lib/generated-client/models/music-video-info-remote-search-query';
import type { PersonLookupInfoRemoteSearchQuery } from '@jellyfin/sdk/lib/generated-client/models/person-lookup-info-remote-search-query';
import type { SeriesInfoRemoteSearchQuery } from '@jellyfin/sdk/lib/generated-client/models/series-info-remote-search-query';
import type { TrailerInfoRemoteSearchQuery } from '@jellyfin/sdk/lib/generated-client/models/trailer-info-remote-search-query';
import { getItemLookupApi } from '@jellyfin/sdk/lib/utils/api/item-lookup-api';

type RemoteSearchArgs =
    | [typeof BaseItemKind.Book, BookInfoRemoteSearchQuery]
    | [typeof BaseItemKind.BoxSet, BoxSetInfoRemoteSearchQuery]
    | [typeof BaseItemKind.Movie, MovieInfoRemoteSearchQuery]
    | [typeof BaseItemKind.MusicAlbum, AlbumInfoRemoteSearchQuery]
    | [typeof BaseItemKind.MusicArtist, ArtistInfoRemoteSearchQuery]
    | [typeof BaseItemKind.MusicVideo, MusicVideoInfoRemoteSearchQuery]
    | [typeof BaseItemKind.Person, PersonLookupInfoRemoteSearchQuery]
    | [typeof BaseItemKind.Series, SeriesInfoRemoteSearchQuery]
    | [typeof BaseItemKind.Trailer, TrailerInfoRemoteSearchQuery];

/**
 * Performs a remote search for the given item kind and query using the provided API.
 * TODO: This should be migrated to the SDK.
 * @param api - The API instance to use for the search.
 * @param itemKind - The kind of item to search for.
 * @param query - The search query to use.
 * @returns A promise that resolves to the search results.
 */
export function remoteSearch(api: Api, ...[itemKind, query]: RemoteSearchArgs) {
    switch (itemKind) {
        case BaseItemKind.Book:
            return getItemLookupApi(api).getBookRemoteSearchResults({
                bookInfoRemoteSearchQuery: query
            });
        case BaseItemKind.BoxSet:
            return getItemLookupApi(api).getBoxSetRemoteSearchResults({
                boxSetInfoRemoteSearchQuery: query
            });
        case BaseItemKind.Movie:
            return getItemLookupApi(api).getMovieRemoteSearchResults({
                movieInfoRemoteSearchQuery: query
            });
        case BaseItemKind.MusicAlbum:
            return getItemLookupApi(api).getMusicAlbumRemoteSearchResults({
                albumInfoRemoteSearchQuery: query
            });
        case BaseItemKind.MusicArtist:
            return getItemLookupApi(api).getMusicArtistRemoteSearchResults({
                artistInfoRemoteSearchQuery: query
            });
        case BaseItemKind.MusicVideo:
            return getItemLookupApi(api).getMusicVideoRemoteSearchResults({
                musicVideoInfoRemoteSearchQuery: query
            });
        case BaseItemKind.Person:
            return getItemLookupApi(api).getPersonRemoteSearchResults({
                personLookupInfoRemoteSearchQuery: query
            });
        case BaseItemKind.Series:
            return getItemLookupApi(api).getSeriesRemoteSearchResults({
                seriesInfoRemoteSearchQuery: query
            });
        case BaseItemKind.Trailer:
            return getItemLookupApi(api).getTrailerRemoteSearchResults({
                trailerInfoRemoteSearchQuery: query
            });
    }

    throw new Error(`Unsupported base item kind: ${String(itemKind)}`);
}
