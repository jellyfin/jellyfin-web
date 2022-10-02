export interface QueryI {
    SortBy?: string;
    SortOrder?: string;
    IncludeItemTypes?: string;
    Recursive?: boolean;
    Fields?: string;
    ImageTypeLimit?: number;
    EnableTotalRecordCount?: boolean;
    EnableImageTypes?: string;
    StartIndex: number;
    ParentId?: string | null;
    IsFavorite?: boolean;
    IsMissing?: boolean;
    Limit:number;
    NameStartsWithOrGreater?: string;
    NameLessThan?: string;
    NameStartsWith?: string;
    VideoTypes?: string;
    GenreIds?: string;
    Is4K?: boolean;
    IsHD?: boolean;
    Is3D?: boolean;
    HasSubtitles?: boolean;
    HasTrailer?: boolean;
    HasSpecialFeature?: boolean;
    HasThemeSong?: boolean;
    HasThemeVideo?: boolean;
    Filters?: string | null;
}

export interface FiltersI {
    IsPlayed: boolean;
    IsUnplayed: boolean;
    IsFavorite: boolean;
    IsResumable: boolean;
    Is4K: boolean;
    IsHD: boolean;
    IsSD: boolean;
    Is3D: boolean;
    VideoTypes: string;
    SeriesStatus: string;
    HasSubtitles: string;
    HasTrailer: string;
    HasSpecialFeature: string;
    HasThemeSong: string;
    HasThemeVideo: string;
    GenreIds: string;
}

export interface CardOptionsI {
    itemsContainer?: HTMLElement;
    parentContainer?: HTMLElement;
    allowBottomPadding?: boolean;
    centerText?: boolean;
    coverImage?: boolean;
    inheritThumb?: boolean;
    overlayMoreButton?: boolean;
    overlayPlayButton?: boolean;
    overlayText?: boolean;
    preferThumb?: boolean;
    scalable?: boolean;
    shape?: string;
    lazy?: boolean;
    cardLayout?: boolean;
    showParentTitle?: boolean;
    showParentTitleOrTitle?: boolean;
    showAirTime?: boolean;
    showAirDateTime?: boolean;
    showChannelName?: boolean;
    showTitle?: boolean;
    showYear?: boolean;
    showDetailsMenu?: boolean;
    missingIndicator?: boolean;
    showLocationTypeIndicator?: boolean;
    showSeriesYear?: boolean;
    showUnplayedIndicator?: boolean;
    showChildCountIndicator?: boolean;
    lines?: number;
    context?: string;
}
