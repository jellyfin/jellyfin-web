import { LibraryTabContent } from 'types/libraryTabContent';

const DEFAULT_VIEW_CONTENT: Partial<LibraryTabContent> = {
    isPaginationEnabled: true,
    isBtnPlayAllEnabled: false,
    isBtnQueueEnabled: false,
    isBtnShuffleEnabled: false,
    isBtnSortEnabled: true,
    isBtnFilterEnabled: true,
    isBtnNewCollectionEnabled: false,
    isBtnNewPlaylistEnabled: false,
    isBtnGridListEnabled: true,
    isAlphabetPickerEnabled: true
};

export default DEFAULT_VIEW_CONTENT;
