import React, { type FC } from 'react';

import type { ParentId } from 'types/library';
import { LibraryTab } from 'types/libraryTab';
import type { LibraryTabContent } from 'types/libraryTabContent';

import GenresView from './GenresView';
import GuideView from './GuideView';
import ItemsView from './ItemsView';
import ProgramsSectionView from './ProgramsSectionView';
import SuggestionsSectionView from './SuggestionsSectionView';
import UpcomingView from './UpcomingView';

interface PageTabContentProps {
    parentId: ParentId;
    currentTab: LibraryTabContent;
}

const PageTabContent: FC<PageTabContentProps> = ({ parentId, currentTab }) => {
    if (currentTab.viewType === LibraryTab.Suggestions) {
        return (
            <SuggestionsSectionView
                parentId={parentId}
                sectionType={
                    currentTab.sectionsView?.suggestionSections ?? []
                }
                isMovieRecommendationEnabled={
                    currentTab.sectionsView?.isMovieRecommendations
                }
            />
        );
    }

    if (currentTab.viewType === LibraryTab.Programs || currentTab.viewType === LibraryTab.Recordings || currentTab.viewType === LibraryTab.Schedule) {
        return (
            <ProgramsSectionView
                parentId={parentId}
                sectionType={
                    currentTab.sectionsView?.programSections ?? []
                }
                isUpcomingRecordingsEnabled={currentTab.sectionsView?.isLiveTvUpcomingRecordings}
            />
        );
    }

    if (currentTab.viewType === LibraryTab.Upcoming) {
        return (
            <UpcomingView parentId={parentId} />
        );
    }

    if (currentTab.viewType === LibraryTab.Genres) {
        return (
            <GenresView
                parentId={parentId}
                collectionType={currentTab.collectionType ?? undefined}
                itemType={currentTab.itemType || []}
            />
        );
    }

    if (currentTab.viewType === LibraryTab.Guide) {
        return (
            <GuideView />
        );
    }

    return (
        <ItemsView />
    );
};

export default PageTabContent;
