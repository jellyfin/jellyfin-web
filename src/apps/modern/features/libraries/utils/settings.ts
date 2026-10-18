
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

const USER_DEFAULT_VIEW_SETTINGS_KEY = 'libraryUserDefaultViewSettings';

type UserDefaultViewSettings = Pick<LibraryViewSettings, 'ViewMode' | 'SortOrder' | 'ShowTitle' | 'ShowYear' | 'CardLayout'>;

export const getUserDefaultViewSettings = (): Partial<UserDefaultViewSettings> => {
    try {
        const stored = localStorage.getItem(USER_DEFAULT_VIEW_SETTINGS_KEY);
        return stored ? JSON.parse(stored) as Partial<UserDefaultViewSettings> : {};
    } catch {
        return {};
    }
};

export const setUserDefaultViewSettings = (settings: LibraryViewSettings) => {
    const defaults: UserDefaultViewSettings = {
        ViewMode: settings.ViewMode,
        SortOrder: settings.SortOrder,
        ShowTitle: settings.ShowTitle,
        ShowYear: settings.ShowYear,
        CardLayout: settings.CardLayout
    };
    localStorage.setItem(USER_DEFAULT_VIEW_SETTINGS_KEY, JSON.stringify(defaults));
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
        StartIndex: 0,
        ...getUserDefaultViewSettings()
    };
};

export const getSettingsKey = (viewType: LibraryTab, parentId: ParentId) => {
    return `${viewType} - ${parentId}`;
};
