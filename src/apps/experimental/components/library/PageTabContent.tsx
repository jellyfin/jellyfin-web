import Box from '@mui/material/Box/Box';
import { type FC } from 'react';
import SuggestionsSectionView from './SuggestionsSectionView';
import UpcomingView from './UpcomingView';
import GenresView from './GenresView';
import ItemsView from './ItemsView';
import GuideView from './GuideView';
import ProgramsSectionView from './ProgramsSectionView';
import { LibraryTab } from 'types/libraryTab';
import type { ParentId } from 'types/library';
import type { LibraryTabContent } from 'types/libraryTabContent';
import LibraryViewMenu from './LibraryViewMenu';

interface PageTabContentProps {
    parentId: ParentId;
    currentTab: LibraryTabContent;
}

const PageTabContent: FC<PageTabContentProps> = ({ parentId, currentTab }) => {
    if (currentTab.viewType === LibraryTab.Suggestions) {
        return (
            <>
                <Box className='padded-top padded-left padded-right padded-bottom'>
                    <LibraryViewMenu />
                </Box>

                <SuggestionsSectionView
                    parentId={parentId}
                    sectionType={
                        currentTab.sectionsView?.suggestionSections ?? []
                    }
                    isMovieRecommendationEnabled={
                        currentTab.sectionsView?.isMovieRecommendations
                    }
                />
            </>
        );
    }

    if (currentTab.viewType === LibraryTab.Programs || currentTab.viewType === LibraryTab.Recordings || currentTab.viewType === LibraryTab.Schedule) {
        return (
            <>
                <Box className='padded-top padded-left padded-right padded-bottom'>
                    <LibraryViewMenu />
                </Box>

                <ProgramsSectionView
                    parentId={parentId}
                    sectionType={
                        currentTab.sectionsView?.programSections ?? []
                    }
                    isUpcomingRecordingsEnabled={currentTab.sectionsView?.isLiveTvUpcomingRecordings}
                />
            </>
        );
    }

    if (currentTab.viewType === LibraryTab.Upcoming) {
        return (
            <>
                <Box className='padded-top padded-left padded-right padded-bottom'>
                    <LibraryViewMenu />
                </Box>

                <UpcomingView parentId={parentId} />
            </>
        );
    }

    if (currentTab.viewType === LibraryTab.Genres) {
        return (
            <>
                <Box className='padded-top padded-left padded-right padded-bottom'>
                    <LibraryViewMenu />
                </Box>

                <GenresView
                    parentId={parentId}
                    collectionType={currentTab.collectionType}
                    itemType={currentTab.itemType || []}
                />
            </>
        );
    }

    if (currentTab.viewType === LibraryTab.Guide) {
        return (
            <>
                <Box
                    className='padded-top padded-left padded-right padded-bottom'
                    sx={{
                        position: 'relative',
                        zIndex: 2
                    }}
                >
                    <LibraryViewMenu />
                </Box>

                <GuideView />
            </>
        );
    }

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
            noItemsMessage={
                currentTab.noItemsMessage || 'MessageNoItemsAvailable'
            }
        />
    );
};

export default PageTabContent;
