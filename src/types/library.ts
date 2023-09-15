import type { ItemFilter } from '@jellyfin/sdk/lib/generated-client/models/item-filter';
import type { VideoType } from '@jellyfin/sdk/lib/generated-client/models/video-type';
import type { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order';
import type { SeriesStatus } from '@jellyfin/sdk/lib/generated-client/models/series-status';
import { ItemSortBy } from '@jellyfin/sdk/lib/models/api/item-sort-by';
import { ImageType } from '@jellyfin/sdk/lib/generated-client';

export type ParentId = string | null | undefined;

export interface LibraryViewProps {
    parentId: string | null;
}

interface Filters {
    Features?: string[];
    Genres?: string[];
    OfficialRatings?: string[];
    Status?: ItemFilter[];
    EpisodesStatus?: string[];
    SeriesStatus?: SeriesStatus[];
    StudioIds?: string[];
    Tags?: string[];
    VideoTypes?: VideoType[];
    Years?: number[];
}

export enum ViewMode {
    GridView = 'grid',
    ListView = 'list',
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
    IsSD?: boolean;
    IsHD?: boolean;
    Is4K?: boolean;
    Is3D?: boolean;
    NameLessThan?: string | null;
    NameStartsWith?: string | null;
}
