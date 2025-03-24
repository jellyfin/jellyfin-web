import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import { CardShape } from 'utils/card';
import { Section } from '../types';
import { CardOptions } from 'types/cardOptions';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { LIVETV_CARD_OPTIONS } from '../constants/liveTvCardOptions';
import { SEARCH_SECTIONS_SORT_ORDER } from '../constants/sectionSortOrder';

export const isMovies = (collectionType: string) =>
    collectionType === CollectionType.Movies;

export const isTVShows = (collectionType: string) =>
    collectionType === CollectionType.Tvshows;

export const isMusic = (collectionType: string) =>
    collectionType === CollectionType.Music;

export const isLivetv = (collectionType: string) =>
    collectionType === CollectionType.Livetv;

export function addSection(
    sections: Section[],
    title: string,
    items: BaseItemDto[] | null | undefined,
    cardOptions?: CardOptions
) {
    if (items && items?.length > 0) {
        sections.push({ title, items, cardOptions });
    }
}

export function sortSections(sections: Section[]) {
    return sections.sort((a, b) => {
        const indexA = SEARCH_SECTIONS_SORT_ORDER.indexOf(a.title);
        const indexB = SEARCH_SECTIONS_SORT_ORDER.indexOf(b.title);

        if (indexA > indexB) {
            return 1;
        } else if (indexA < indexB) {
            return -1;
        } else {
            return 0;
        }
    });
}

export function getCardOptionsFromType(type: BaseItemKind) {
    switch (type) {
        case BaseItemKind.Movie:
        case BaseItemKind.Series:
        case BaseItemKind.MusicAlbum:
            return {
                showYear: true
            };
        case BaseItemKind.Episode:
            return {
                coverImage: true,
                showParentTitle: true
            };
        case BaseItemKind.MusicArtist:
            return {
                coverImage: true
            };
        case BaseItemKind.Audio:
            return {
                showParentTitle: true,
                shape: CardShape.SquareOverflow
            };
        case BaseItemKind.LiveTvProgram:
            return LIVETV_CARD_OPTIONS;
        default:
            return {};
    }
}

export function getTitleFromType(type: BaseItemKind) {
    switch (type) {
        case BaseItemKind.Movie:
            return 'Movies';
        case BaseItemKind.Series:
            return 'Shows';
        case BaseItemKind.Episode:
            return 'Episodes';
        case BaseItemKind.Playlist:
            return 'Playlists';
        case BaseItemKind.MusicAlbum:
            return 'Albums';
        case BaseItemKind.Audio:
            return 'Songs';
        case BaseItemKind.LiveTvProgram:
            return 'Programs';
        case BaseItemKind.TvChannel:
            return 'Channels';
        case BaseItemKind.PhotoAlbum:
            return 'HeaderPhotoAlbums';
        case BaseItemKind.Photo:
            return 'Photos';
        case BaseItemKind.AudioBook:
            return 'HeaderAudioBooks';
        case BaseItemKind.Book:
            return 'Books';
        case BaseItemKind.BoxSet:
            return 'Collections';
        default:
            return '';
    }
}

export function getItemTypesFromCollectionType(collectionType: CollectionType | undefined) {
    switch (collectionType) {
        case CollectionType.Movies:
            return [ BaseItemKind.Movie ];
        case CollectionType.Tvshows:
            return [
                BaseItemKind.Series,
                BaseItemKind.Episode
            ];
        case CollectionType.Music:
            return [
                BaseItemKind.Playlist,
                BaseItemKind.MusicAlbum,
                BaseItemKind.Audio
            ];
        default:
            return [
                BaseItemKind.Movie,
                BaseItemKind.Series,
                BaseItemKind.Episode,
                BaseItemKind.Playlist,
                BaseItemKind.MusicAlbum,
                BaseItemKind.Audio,
                BaseItemKind.TvChannel,
                BaseItemKind.PhotoAlbum,
                BaseItemKind.Photo,
                BaseItemKind.AudioBook,
                BaseItemKind.Book,
                BaseItemKind.BoxSet
            ];
    }
}
