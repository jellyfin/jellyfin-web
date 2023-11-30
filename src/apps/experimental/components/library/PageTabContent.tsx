import React, { FC } from 'react';
import SuggestionsView from './SuggestionsView';
import UpcomingView from './UpcomingView';
import GenresView from './GenresView';
import ItemsView from './ItemsView';
import { LibraryTab } from 'types/libraryTab';
import { ParentId } from 'types/library';
import { LibraryTabContent } from 'types/libraryTabContent';

interface PageTabContentProps {
    parentId: ParentId;
    currentTab: LibraryTabContent;
}

const PageTabContent: FC<PageTabContentProps> = ({ parentId, currentTab }) => {
    if (currentTab.viewType === LibraryTab.Suggestions) {
        return (
            <SuggestionsView
                parentId={parentId}
                suggestionSectionViews={
                    currentTab.sectionsType?.suggestionSectionsView
                }
                isMovieRecommendations={
                    currentTab.sectionsType?.isMovieRecommendations
                }
            />
        );
    }

    if (currentTab.viewType === LibraryTab.Upcoming) {
        return <UpcomingView parentId={parentId} />;
    }

    if (currentTab.viewType === LibraryTab.Genres) {
        return (
            <GenresView
                parentId={parentId}
                collectionType={currentTab.collectionType}
                itemType={currentTab.itemType || []}
            />
        );
    }

    return (
        <ItemsView
            viewType={currentTab.viewType}
            parentId={parentId}
            collectionType={currentTab.collectionType}
            isBtnPlayAllEnabled={currentTab.isBtnPlayAllEnabled}
            isBtnQueueEnabled={currentTab.isBtnQueueEnabled}
            isBtnShuffleEnabled={currentTab.isBtnShuffleEnabled}
            isBtnNewCollectionEnabled={currentTab.isBtnNewCollectionEnabled}
            isBtnFilterEnabled={currentTab.isBtnFilterEnabled}
            isBtnGridListEnabled={currentTab.isBtnGridListEnabled}
            isBtnSortEnabled={currentTab.isBtnSortEnabled}
            isAlphabetPickerEnabled={currentTab.isAlphabetPickerEnabled}
            itemType={currentTab.itemType || []}
            noItemsMessage={
                currentTab.noItemsMessage || 'MessageNoItemsAvailable'
            }
        />
    );
};

export default PageTabContent;
