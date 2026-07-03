
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order';

import { type ParentId, ViewMode, type LibraryViewSettings } from 'types/library';
import { LibraryTab } from 'types/libraryTab';

export const getDefaultSortBy = (viewType: LibraryTab) => {
    if (viewType === LibraryTab.Episodes) {
        return ItemSortBy.SeriesSortName;
    }

    return ItemSortBy.SortName;
};

export const getDefaultLibraryViewSettings = (viewType: LibraryTab): LibraryViewSettings => {
    return {
        ShowTitle: true,
        ShowYear: true,
        ViewMode: viewType === LibraryTab.Songs ? ViewMode.ListView : ViewMode.GridView,
        ImageType: viewType === LibraryTab.Studios ? ImageType.Thumb : ImageType.Primary,
        CardLayout: false,
        SortBy: getDefaultSortBy(viewType),
        SortOrder: SortOrder.Ascending,
        StartIndex: 0
    };
};

export const getSettingsKey = (viewType: LibraryTab, parentId: ParentId) => {
    return `${viewType} - ${parentId}`;
};
