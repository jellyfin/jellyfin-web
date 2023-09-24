import React, { FC } from 'react';
import Box from '@mui/material/Box';
import SuggestionsItemsContainer from './SuggestionsItemsContainer';
import RecommendationItemsContainer from './RecommendationItemsContainer';
import FavoriteItemsContainer from './FavoriteItemsContainer';
import { CollectionType } from 'types/collectionType';
import { ParentId } from 'types/library';
import { SectionsView } from 'types/suggestionsSections';
import { useLibrarySettings } from 'hooks/useLibrarySettings';

const getVisibleId = (collectionType: CollectionType) => {
    const visibleSuggestionsId: SectionsView[] = [];
    const visibleFavoriteId: SectionsView[] = [];

    if (collectionType === CollectionType.Movies) {
        visibleSuggestionsId.push(SectionsView.ContinueWatchingMovies);
        visibleSuggestionsId.push(SectionsView.LatestMovies);
        visibleFavoriteId.push(SectionsView.FavoriteMovies);
    }

    if (collectionType === CollectionType.TvShows) {
        visibleSuggestionsId.push(SectionsView.ContinueWatchingEpisode);
        visibleSuggestionsId.push(SectionsView.LatestEpisode);
        visibleSuggestionsId.push(SectionsView.NextUp);
        visibleFavoriteId.push(SectionsView.FavoriteShows);
        visibleFavoriteId.push(SectionsView.FavoriteEpisode);
    }

    if (collectionType === CollectionType.Music) {
        visibleSuggestionsId.push(SectionsView.LatestMusic);
        visibleSuggestionsId.push(SectionsView.FrequentlyPlayedMusic);
        visibleSuggestionsId.push(SectionsView.RecentlyPlayedMusic);
        visibleFavoriteId.push(SectionsView.FavoriteArtists);
        visibleFavoriteId.push(SectionsView.FavoriteAlbums);
        visibleFavoriteId.push(SectionsView.FavoriteSongs);
    }

    return {
        visibleSuggestionsId,
        visibleFavoriteId
    };
};

interface SuggestionsViewProps {
    collectionType?: CollectionType;
    parentId?: ParentId;
}

const SuggestionsView: FC<SuggestionsViewProps> = () => {
    const { item } = useLibrarySettings();
    return (
        <Box>
            <SuggestionsItemsContainer
                parentId={item?.Id}
                sectionsView={getVisibleId(item?.CollectionType as CollectionType).visibleSuggestionsId}
            />

            <FavoriteItemsContainer
                parentId={item?.Id}
                sectionsView={getVisibleId(item?.CollectionType as CollectionType).visibleFavoriteId}
            />

            {item?.CollectionType === CollectionType.Movies && (
                <RecommendationItemsContainer parentId={item?.Id} />
            )}
        </Box>
    );
};

export default SuggestionsView;
