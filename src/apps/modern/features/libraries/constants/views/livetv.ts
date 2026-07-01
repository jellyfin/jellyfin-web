import { LibraryTab } from 'types/libraryTab';
import type { LibraryTabContent } from 'types/libraryTabContent';
import { SectionType } from 'types/sections';

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
    sectionsView: {
        programSections: [SectionType.ActiveRecordings],
        isLiveTvUpcomingRecordings: true
    }
};

const recordingsTabContent: LibraryTabContent = {
    viewType: LibraryTab.Recordings,
    sectionsView: {
        programSections: [
            SectionType.LatestRecordings,
            SectionType.RecordingFolders
        ]
    }
};

const channelsTabContent: LibraryTabContent = {
    viewType: LibraryTab.Channels,
    isBtnGridListEnabled: false,
    isBtnSortEnabled: false,
    isAlphabetPickerEnabled: false
};

const programsTabContent: LibraryTabContent = {
    viewType: LibraryTab.Programs,
    sectionsView: {
        programSections: [
            SectionType.ActivePrograms,
            SectionType.UpcomingEpisodes,
            SectionType.UpcomingMovies,
            SectionType.UpcomingSports,
            SectionType.UpcomingKids,
            SectionType.UpcomingNews
        ]
    }
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
