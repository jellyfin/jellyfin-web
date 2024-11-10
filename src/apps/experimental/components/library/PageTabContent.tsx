import React, { type FC } from 'react';
import SuggestionsSectionView from './SuggestionsSectionView';
import UpcomingView from './UpcomingView';
import GenresView from './GenresView';
import ItemsView from './ItemsView';
import GuideView from './GuideView';
import ProgramsSectionView from './ProgramsSectionView';
import { LibraryTab } from 'types/libraryTab';
import type { ParentId } from 'types/library';
import type { LibraryTabContent } from 'types/libraryTabContent';

interface PageTabContentProps {
    parentId: ParentId;
    currentTab: LibraryTabContent;
}

const PageTabContent: FC<PageTabContentProps> = ({ parentId, currentTab }) => {
    switch (currentTab.viewType) {
        case LibraryTab.Suggestions: {
            return (
                <SuggestionsSectionView
                    parentId={parentId}
                    sectionType={currentTab.sectionsView?.suggestionSections ?? []}
                    isMovieRecommendationEnabled={currentTab.sectionsView?.isMovieRecommendations}
                />
            );
        }
        case LibraryTab.Upcoming: {
            return <UpcomingView parentId={parentId} />;
        }
        case LibraryTab.Genres: {
            return (
                <GenresView
                    parentId={parentId}
                    collectionType={currentTab.collectionType}
                    itemType={currentTab.itemType || []}
                />
            );
        }
        case LibraryTab.Programs:
        case LibraryTab.Recordings:
        case LibraryTab.Schedule: {
            return (
                <ProgramsSectionView
                    parentId={parentId}
                    sectionType={currentTab.sectionsView?.programSections ?? []}
                    isUpcomingRecordingsEnabled={currentTab.sectionsView?.isLiveTvUpcomingRecordings}
                />
            );
        }
        case LibraryTab.Guide: {
            return <GuideView />;
        }
        default: {
            return (
                <ItemsView
                    viewType={currentTab.viewType}
                    parentId={parentId}
                    collectionType={currentTab.collectionType}
                    isPaginationEnabled={currentTab.isPaginationEnabled}
                    isBtnPlayAllEnabled={currentTab.isBtnPlayAllEnabled}
                    isBtnQueueEnabled={currentTab.isBtnQueueEnabled}
                    isBtnShuffleEnabled={currentTab.isBtnShuffleEnabled}
                    isBtnNewCollectionEnabled={currentTab.isBtnNewCollectionEnabled}
                    isBtnFilterEnabled={currentTab.isBtnFilterEnabled}
                    isBtnGridListEnabled={currentTab.isBtnGridListEnabled}
                    isBtnSortEnabled={currentTab.isBtnSortEnabled}
                    isAlphabetPickerEnabled={currentTab.isAlphabetPickerEnabled}
                    itemType={currentTab.itemType || []}
                    noItemsMessage={currentTab.noItemsMessage || 'MessageNoItemsAvailable'}
                />
            );
        }
    }
};

export default PageTabContent;
