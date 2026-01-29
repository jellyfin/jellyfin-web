import type { ImageType } from '@jellyfin/sdk/lib/generated-client';
import type { ItemFilter } from '@jellyfin/sdk/lib/generated-client/models/item-filter';
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import type { SeriesStatus } from '@jellyfin/sdk/lib/generated-client/models/series-status';
import type { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order';
import type { VideoType } from '@jellyfin/sdk/lib/generated-client/models/video-type';

export type ParentId = string | null | undefined;

export interface LibraryViewProps {
    parentId: ParentId;
}

export enum FeatureFilters {
    HasSubtitles = 'HasSubtitles',
    HasTrailer = 'HasTrailer',
    HasSpecialFeature = 'HasSpecialFeature',
    HasThemeSong = 'HasThemeSong',
    HasThemeVideo = 'HasThemeVideo'
}

export enum EpisodeFilter {
    ParentIndexNumber = 'ParentIndexNumber',
    IsMissing = 'IsMissing',
    IsUnaired = 'IsUnaired'
}

export enum VideoBasicFilter {
    IsSD = 'IsSD',
    IsHD = 'IsHD',
    Is4K = 'Is4K',
    Is3D = 'Is3D'
}

export interface Filters {
    Features?: FeatureFilters[];
    Genres?: string[];
    OfficialRatings?: string[];
    EpisodeFilter?: EpisodeFilter[];
    Status?: ItemFilter[];
    EpisodesStatus?: string[];
    SeriesStatus?: SeriesStatus[];
    StudioIds?: string[];
    Tags?: string[];
    VideoBasicFilter?: VideoBasicFilter[];
    VideoTypes?: VideoType[];
    Years?: number[];
}

export enum ViewMode {
    GridView = 'grid',
    ListView = 'list'
}

export interface LibraryViewSettings {
    SortBy: ItemSortBy;
    SortOrder: SortOrder;
    StartIndex: number;
    CardLayout: boolean;
    ImageType: ImageType;
    ViewMode: ViewMode;
    ShowTitle: boolean;
    ShowYear?: boolean;
    Filters?: Filters;
    Alphabet?: string | null;
}
