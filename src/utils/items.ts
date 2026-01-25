import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order';
import * as userSettings from 'scripts/settings/userSettings';
import layoutManager from 'components/layoutManager';
import {
    EpisodeFilter,
    FeatureFilters,
    type LibraryViewSettings,
    type ParentId,
    VideoBasicFilter,
    ViewMode
} from '../types/library';
import { LibraryTab } from 'types/libraryTab';
import type { AttributesOpts, DataAttributes } from 'types/dataAttributes';

export const getVideoBasicFilter = (libraryViewSettings: LibraryViewSettings) => {
    let isHd;

    if (libraryViewSettings.Filters?.VideoBasicFilter?.includes(VideoBasicFilter.IsHD)) {
        isHd = true;
    }

    if (libraryViewSettings.Filters?.VideoBasicFilter?.includes(VideoBasicFilter.IsSD)) {
        isHd = false;
    }

    return {
        isHd,
        is4K: libraryViewSettings.Filters?.VideoBasicFilter?.includes(VideoBasicFilter.Is4K) ? true : undefined,
        is3D: libraryViewSettings.Filters?.VideoBasicFilter?.includes(VideoBasicFilter.Is3D) ? true : undefined
    };
};

export const getFeatureFilters = (libraryViewSettings: LibraryViewSettings) => {
    return {
        hasSubtitles: libraryViewSettings.Filters?.Features?.includes(FeatureFilters.HasSubtitles) ? true : undefined,
        hasTrailer: libraryViewSettings.Filters?.Features?.includes(FeatureFilters.HasTrailer) ? true : undefined,
        hasSpecialFeature: libraryViewSettings.Filters?.Features?.includes(FeatureFilters.HasSpecialFeature)
            ? true
            : undefined,
        hasThemeSong: libraryViewSettings.Filters?.Features?.includes(FeatureFilters.HasThemeSong) ? true : undefined,
        hasThemeVideo: libraryViewSettings.Filters?.Features?.includes(FeatureFilters.HasThemeVideo) ? true : undefined
    };
};

export const getEpisodeFilter = (viewType: LibraryTab, libraryViewSettings: LibraryViewSettings) => {
    return {
        parentIndexNumber: libraryViewSettings.Filters?.EpisodeFilter?.includes(EpisodeFilter.ParentIndexNumber)
            ? 0
            : undefined,
        isMissing:
            viewType === LibraryTab.Episodes
                ? !!libraryViewSettings.Filters?.EpisodeFilter?.includes(EpisodeFilter.IsMissing)
                : undefined,
        isUnaired: libraryViewSettings.Filters?.EpisodeFilter?.includes(EpisodeFilter.IsUnaired) ? true : undefined
    };
};

const getItemFieldsEnum = (viewType: LibraryTab, libraryViewSettings: LibraryViewSettings) => {
    const itemFields: ItemFields[] = [];

    if (viewType !== LibraryTab.Networks) {
        itemFields.push(ItemFields.MediaSourceCount);
    }

    if (libraryViewSettings.ImageType === ImageType.Primary) {
        itemFields.push(ItemFields.PrimaryImageAspectRatio);
    }

    if (viewType === LibraryTab.Networks) {
        itemFields.push(ItemFields.DateCreated, ItemFields.PrimaryImageAspectRatio);
    }

    return itemFields;
};

export const getFieldsQuery = (viewType: LibraryTab, libraryViewSettings: LibraryViewSettings) => {
    return {
        fields: getItemFieldsEnum(viewType, libraryViewSettings)
    };
};

export const getLimitQuery = () => {
    return {
        limit: userSettings.libraryPageSize(undefined) || undefined
    };
};

export const getAlphaPickerQuery = (libraryViewSettings: LibraryViewSettings) => {
    const alphabetValue = libraryViewSettings.Alphabet !== null ? libraryViewSettings.Alphabet : undefined;

    return {
        nameLessThan: alphabetValue === '#' ? 'A' : undefined,
        nameStartsWith: alphabetValue === '#' ? undefined : alphabetValue
    };
};

export const getFiltersQuery = (viewType: LibraryTab, libraryViewSettings: LibraryViewSettings) => {
    return {
        ...getFeatureFilters(libraryViewSettings),
        ...getEpisodeFilter(viewType, libraryViewSettings),
        ...getVideoBasicFilter(libraryViewSettings),
        seriesStatus: libraryViewSettings?.Filters?.SeriesStatus,
        videoTypes: libraryViewSettings?.Filters?.VideoTypes,
        filters: libraryViewSettings?.Filters?.Status,
        genres: libraryViewSettings?.Filters?.Genres,
        officialRatings: libraryViewSettings?.Filters?.OfficialRatings,
        tags: libraryViewSettings?.Filters?.Tags,
        years: libraryViewSettings?.Filters?.Years,
        studioIds: libraryViewSettings?.Filters?.StudioIds
    };
};

export const getSettingsKey = (viewType: LibraryTab, parentId: ParentId) => {
    return `${viewType} - ${parentId}`;
};

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
        ImageType: viewType === LibraryTab.Networks ? ImageType.Thumb : ImageType.Primary,
        CardLayout: false,
        SortBy: getDefaultSortBy(viewType),
        SortOrder: SortOrder.Ascending,
        StartIndex: 0
    };
};

export function getDataAttributes(opts: AttributesOpts): DataAttributes {
    return {
        'data-context': opts.context,
        'data-collectionid': opts.collectionId,
        'data-playlistid': opts.playlistId,
        'data-parentid': opts.parentId,
        'data-playlistitemid': opts.itemPlaylistItemId,
        'data-action': layoutManager.tv ? opts.action : null,
        'data-serverid': opts.itemServerId,
        'data-id': opts.itemId,
        'data-timerid': opts.itemTimerId,
        'data-seriestimerid': opts.itemSeriesTimerId,
        'data-channelid': opts.itemChannelId,
        'data-type': opts.itemType,
        'data-mediatype': opts.itemMediaType,
        'data-collectiontype': opts.itemCollectionType,
        'data-isfolder': opts.itemIsFolder,
        'data-path': opts.itemPath,
        'data-prefix': opts.prefix,
        'data-positionticks': opts.itemUserData?.PlaybackPositionTicks,
        'data-startdate': opts.itemStartDate?.toString(),
        'data-enddate': opts.itemEndDate?.toString()
    };
}
