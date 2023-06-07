import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import { ItemFilter } from '@jellyfin/sdk/lib/generated-client/models/item-filter';
import { VideoType } from '@jellyfin/sdk/lib/generated-client/models/video-type';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { ItemSortBy } from '@jellyfin/sdk/lib/models/api/item-sort-by';
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order';
import { SeriesStatus } from '@jellyfin/sdk/lib/generated-client/models/series-status';

export interface ParametersOptions {
    sortBy?: ItemSortBy[];
    sortOrder?: SortOrder[];
    includeItemTypes?: BaseItemKind[];
    fields?: ItemFields[];
    enableImageTypes?: ImageType[];
    videoTypes?: VideoType[];
    seriesStatus?: SeriesStatus[];
    filters?: ItemFilter[];
    limit?: number;
    isFavorite?: boolean;
    genres?: string[];
    officialRatings?: string[];
    tags?: string[];
    years?: number[];
    is4K?: boolean;
    isHd?: boolean;
    is3D?: boolean;
    hasSubtitles?: boolean;
    hasTrailer?: boolean;
    hasSpecialFeature?: boolean;
    hasThemeSong?: boolean;
    hasThemeVideo?: boolean;
    parentIndexNumber?: number;
    isMissing?: boolean;
    isUnaired?: boolean;
    startIndex?: number;
    nameLessThan?: string;
    nameStartsWith?: string;
    collapseBoxSetItems?: boolean;
    enableTotalRecordCount?: boolean;
}

export interface LibraryViewProps {
    parentId: string | null;
}
