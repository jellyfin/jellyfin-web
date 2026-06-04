import { LibraryTab } from 'types/libraryTab';
import type { LibraryTabContent } from 'types/libraryTabContent';
import { ProgramSectionsView, RecordingsSectionsView, ScheduleSectionsView } from 'types/sections';

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

const liveTvViews: Record<number, LibraryTabContent> = {
    0: programsTabContent,
    1: guideTabContent,
    2: channelsTabContent,
    3: recordingsTabContent,
    4: scheduleTabContent,
    5: seriestimersTabContent
};

export default liveTvViews;
