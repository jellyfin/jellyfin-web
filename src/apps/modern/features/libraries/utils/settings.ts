
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order';

import { type ParentId, ViewMode, type LibraryViewSettings } from 'types/library';
import { LibraryTab } from 'types/libraryTab';

export const getDefaultSortBy = (viewType: LibraryTab): ItemSortBy[] => {
    if (viewType === LibraryTab.Episodes) {
        return [ItemSortBy.SeriesSortName];
    }

    return [ItemSortBy.SortName];
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

export const getSortSettingsFromUrl = (
    sortBy: string | null,
    sortOrder: string | null
): Pick<LibraryViewSettings, 'SortBy' | 'SortOrder'> | undefined => {
    const sortFields = sortBy?.split(',') as ItemSortBy[] | undefined;
    const validSortFields = Object.values(ItemSortBy);

    // ignore incomplete or invalid url settings
    if (
        !sortFields?.length
        || sortFields.some(field => !validSortFields.includes(field))
        || !Object.values(SortOrder).includes(sortOrder as SortOrder)
    ) {
        return undefined;
    }

    return {
        SortBy: sortFields,
        SortOrder: sortOrder as SortOrder
    };
};
