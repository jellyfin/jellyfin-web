
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

// Only ItemSortBy values valid for every library type belong here - anything
// type-specific (AlbumArtist, SeriesSortName, ...) would error for other types.
export enum DefaultSortByOption {
    Name = 'Name',
    DateAdded = 'DateAdded',
    Random = 'Random'
}

const resolveSortBy = (viewType: LibraryTab, option?: DefaultSortByOption): ItemSortBy[] => {
    switch (option) {
        case DefaultSortByOption.Random:
            return [ItemSortBy.Random];
        case DefaultSortByOption.DateAdded:
            return [ItemSortBy.DateCreated, ...getDefaultSortBy(viewType)];
        case DefaultSortByOption.Name:
        default:
            return getDefaultSortBy(viewType);
    }
};

const USER_DEFAULT_VIEW_SETTINGS_KEY = 'libraryUserDefaultViewSettings';

type UserDefaultViewSettings = Pick<LibraryViewSettings, 'ViewMode' | 'SortOrder'> & {
    SortBy?: DefaultSortByOption;
};

export const getUserDefaultViewSettings = (): Partial<UserDefaultViewSettings> => {
    try {
        const stored = localStorage.getItem(USER_DEFAULT_VIEW_SETTINGS_KEY);
        return stored ? JSON.parse(stored) as Partial<UserDefaultViewSettings> : {};
    } catch {
        return {};
    }
};

export const setUserDefaultViewSettings = (settings: Partial<UserDefaultViewSettings>) => {
    localStorage.setItem(USER_DEFAULT_VIEW_SETTINGS_KEY, JSON.stringify(settings));
};

export const clearAllLibraryViewSettings = () => {
    const prefixes = Object.values(LibraryTab).map(tab => getSettingsKeyPrefix(tab));
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && prefixes.some(prefix => key.startsWith(prefix))) {
            keysToRemove.push(key);
        }
    }

    keysToRemove.forEach(key => {
        localStorage.removeItem(key);
    });
};

export const getDefaultLibraryViewSettings = (viewType: LibraryTab): LibraryViewSettings => {
    const userDefaults = getUserDefaultViewSettings();

    return {
        ShowTitle: true,
        ShowYear: true,
        ViewMode: userDefaults.ViewMode ?? (viewType === LibraryTab.Songs ? ViewMode.ListView : ViewMode.GridView),
        ImageType: viewType === LibraryTab.Studios ? ImageType.Thumb : ImageType.Primary,
        CardLayout: false,
        SortBy: resolveSortBy(viewType, userDefaults.SortBy),
        SortOrder: userDefaults.SortOrder ?? SortOrder.Ascending,
        StartIndex: 0
    };
};

const getSettingsKeyPrefix = (viewType: LibraryTab) => `${viewType} - `;

export const getSettingsKey = (viewType: LibraryTab, parentId: ParentId) => {
    return `${getSettingsKeyPrefix(viewType)}${parentId}`;
};
