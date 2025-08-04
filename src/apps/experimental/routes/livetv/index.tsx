import React, { FC } from 'react';
import useCurrentTab from 'hooks/useCurrentTab';
import Page from 'components/Page';
import PageTabContent from '../../components/library/PageTabContent';
import { LibraryTab } from 'types/libraryTab';
import { LibraryTabContent, LibraryTabMapping } from 'types/libraryTabContent';
import {
    ProgramSectionsView,
    RecordingsSectionsView,
    ScheduleSectionsView
} from 'types/sections';

const seriestimersTabContent: LibraryTabContent = {
    viewType: LibraryTab.SeriesTimers,
    isPaginationEnabled: false,
    isBtnFilterEnabled: false,
    isBtnGridListEnabled: false,
    isBtnSortEnabled: false,
    isAlphabetPickerEnabled: false
};

const scheduleTabContent: LibraryTabContent = {
    viewType: LibraryTab.Schedule,
    sectionsView: ScheduleSectionsView
};

const recordingsTabContent: LibraryTabContent = {
    viewType: LibraryTab.Recordings,
    sectionsView: RecordingsSectionsView
};

const channelsTabContent: LibraryTabContent = {
    viewType: LibraryTab.Channels,
    isBtnGridListEnabled: false,
    isBtnSortEnabled: false,
    isAlphabetPickerEnabled: false
};

const programsTabContent: LibraryTabContent = {
    viewType: LibraryTab.Programs,
    sectionsView: ProgramSectionsView
};

const guideTabContent: LibraryTabContent = {
    viewType: LibraryTab.Guide
};

const liveTvTabMapping: LibraryTabMapping = {
    0: programsTabContent,
    1: guideTabContent,
    2: channelsTabContent,
    3: recordingsTabContent,
    4: scheduleTabContent,
    5: seriestimersTabContent
};

const LiveTv: FC = () => {
    const { libraryId, activeTab } = useCurrentTab();
    const currentTab = liveTvTabMapping[activeTab];

    return (
        <Page
            id='liveTvPage'
            className='mainAnimatedPage libraryPage collectionEditorPage pageWithAbsoluteTabs withTabs'
        >
            <PageTabContent
                key={`${currentTab.viewType} - ${libraryId}`}
                currentTab={currentTab}
                parentId={libraryId}
            />
        </Page>
    );
};

export default LiveTv;
