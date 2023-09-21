import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client';
import React, { FC } from 'react';
import FavoritesSectionContainer from './FavoritesSectionContainer';
import { ParentId } from 'types/library';
import { SectionsView, SectionsViewType } from 'types/suggestionsSections';

function getFavoriteSections() {
    return [
        {
            name: 'HeaderFavoriteMovies',
            type: 'Movie',
            view: SectionsView.FavoriteMovies,
            parametersOptions: {
                includeItemTypes: [BaseItemKind.Movie]
            },
            cardOptions: {
                shape: 'overflowPortrait',
                showTitle: true,
                showYear: true,
                overlayPlayButton: true,
                overlayText: false,
                centerText: true
            }
        },
        {
            name: 'HeaderFavoriteShows',
            type: 'Series',
            view: SectionsView.FavoriteShows,
            parametersOptions: {
                includeItemTypes: [BaseItemKind.Series]
            },
            cardOptions: {
                shape: 'overflowPortrait',
                showTitle: true,
                showYear: true,
                overlayPlayButton: true,
                overlayText: false,
                centerText: true
            }
        },
        {
            name: 'HeaderFavoriteEpisodes',
            type: 'Episode',
            view: SectionsView.FavoriteEpisode,
            parametersOptions: {
                includeItemTypes: [BaseItemKind.Episode]
            },
            cardOptions: {
                shape: 'overflowBackdrop',
                preferThumb: false,
                showTitle: true,
                showParentTitle: true,
                overlayPlayButton: true,
                overlayText: false,
                centerText: true
            }
        },
        {
            name: 'HeaderFavoriteVideos',
            type: 'Video,MusicVideo',
            view: SectionsView.FavoriteVideos,
            parametersOptions: {
                includeItemTypes: [BaseItemKind.Video, BaseItemKind.MusicVideo]
            },
            cardOptions: {
                shape: 'overflowBackdrop',
                preferThumb: true,
                showTitle: true,
                overlayPlayButton: true,
                overlayText: false,
                centerText: true
            }
        },
        {
            name: 'HeaderFavoriteCollections',
            type: 'BoxSet',
            view: SectionsView.FavoriteCollections,
            parametersOptions: {
                includeItemTypes: [BaseItemKind.BoxSet]
            },
            cardOptions: {
                shape: 'overflowPortrait',
                showTitle: true,
                overlayPlayButton: true,
                overlayText: false,
                centerText: true
            }
        },
        {
            name: 'HeaderFavoritePlaylists',
            type: 'Playlist',
            view: SectionsView.FavoritePlaylists,
            parametersOptions: {
                includeItemTypes: [BaseItemKind.Playlist]
            },
            cardOptions: {
                shape: 'overflowSquare',
                preferThumb: false,
                showTitle: true,
                overlayText: false,
                showParentTitle: false,
                centerText: true,
                overlayPlayButton: true,
                coverImage: true
            }
        },
        {
            name: 'HeaderFavoritePersons',
            viewType: SectionsViewType.Persons,
            type: 'Person',
            view: SectionsView.FavoritePeople,
            cardOptions: {
                shape: 'overflowPortrait',
                preferThumb: false,
                showTitle: true,
                overlayText: false,
                showParentTitle: false,
                centerText: true,
                overlayPlayButton: true,
                coverImage: true
            }
        },
        {
            name: 'HeaderFavoriteArtists',
            viewType: SectionsViewType.Artists,
            type: 'MusicArtist',
            view: SectionsView.FavoriteArtists,
            cardOptions: {
                shape: 'overflowSquare',
                preferThumb: false,
                showTitle: true,
                overlayText: false,
                showParentTitle: false,
                centerText: true,
                overlayPlayButton: true,
                coverImage: true
            }
        },
        {
            name: 'HeaderFavoriteAlbums',
            type: 'MusicAlbum',
            view: SectionsView.FavoriteAlbums,
            parametersOptions: {
                includeItemTypes: [BaseItemKind.MusicAlbum]
            },
            cardOptions: {
                shape: 'overflowSquare',
                preferThumb: false,
                showTitle: true,
                overlayText: false,
                showParentTitle: true,
                centerText: true,
                overlayPlayButton: true,
                coverImage: true
            }
        },
        {
            name: 'HeaderFavoriteSongs',
            type: 'Audio',
            view: SectionsView.FavoriteSongs,
            parametersOptions: {
                includeItemTypes: [BaseItemKind.Audio]
            },
            cardOptions: {
                shape: 'overflowSquare',
                preferThumb: false,
                showTitle: true,
                overlayText: false,
                showParentTitle: true,
                centerText: true,
                overlayMoreButton: true,
                action: 'instantmix',
                coverImage: true
            }
        },
        {
            name: 'HeaderFavoriteBooks',
            type: 'Book',
            view: SectionsView.FavoriteBooks,
            parametersOptions: {
                includeItemTypes: [BaseItemKind.Book]
            },
            cardOptions: {
                shape: 'overflowPortrait',
                showTitle: true,
                showYear: true,
                overlayPlayButton: true,
                overlayText: false,
                centerText: true
            }
        }
    ];
}

interface FavoriteItemsContainerProps {
    parentId?: ParentId;
    sectionsView: SectionsView[];
}

const FavoriteItemsContainer: FC<FavoriteItemsContainerProps> = ({
    parentId,
    sectionsView
}) => {
    const favoriteSections = getFavoriteSections();

    return (
        <>
            {favoriteSections
                .filter((section) => sectionsView.includes(section.view))
                .map((section) => (
                    <FavoritesSectionContainer
                        key={section.view}
                        parentId={parentId}
                        section={section}
                    />
                ))}
        </>
    );
};

export default FavoriteItemsContainer;
