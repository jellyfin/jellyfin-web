import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import React, { type FC } from 'react';
import useCurrentTab from 'hooks/useCurrentTab';
import Page from 'components/Page';
import PageTabContent from '../../components/library/PageTabContent';
import { LibraryTab } from 'types/libraryTab';
import { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import { LibraryTabContent, LibraryTabMapping } from 'types/libraryTabContent';
import { MusicVideoSuggestionsSectionsView } from 'types/sections';

const foldersTabContent: LibraryTabContent = {
    viewType: LibraryTab.Folders,
    collectionType: CollectionType.Musicvideos,
    isBtnPlayAllEnabled: true,
    isBtnShuffleEnabled: true,
    itemType: [BaseItemKind.Folder, BaseItemKind.MusicVideo]
};

const suggestionsTabContent: LibraryTabContent = {
    viewType: LibraryTab.Suggestions,
    collectionType: CollectionType.Musicvideos,
    sectionsView: MusicVideoSuggestionsSectionsView
};

const musicVideosTabContent: LibraryTabContent = {
    viewType: LibraryTab.MusicVideos,
    collectionType: CollectionType.Musicvideos,
    isBtnPlayAllEnabled: true,
    isBtnShuffleEnabled: true,
    itemType: [BaseItemKind.MusicVideo]
};

const musicVideosTabMapping: LibraryTabMapping = {
    0: foldersTabContent,
    1: suggestionsTabContent,
    2: musicVideosTabContent
};

const MusicVideos: FC = () => {
    const { libraryId, activeTab } = useCurrentTab();
    const currentTab = musicVideosTabMapping[activeTab];

    return (
        <Page
            id='musicvideos'
            className='mainAnimatedPage libraryPage backdropPage collectionEditorPage pageWithAbsoluteTabs withTabs'
            backDropType='musicvideo'
        >
            <PageTabContent
                key={`${currentTab.viewType} - ${libraryId}`}
                currentTab={currentTab}
                parentId={libraryId}
            />
        </Page>
    );
};

export default MusicVideos;
