export interface ViewQuerySettings {
    showTitle?: boolean;
    showYear?: boolean;
    imageType?: string;
    viewType?: string;
    cardLayout?: boolean;
    SortBy?: string | null;
    SortOrder?: string | null;
    IsPlayed?: boolean | null;
    IsUnplayed?: boolean | null;
    IsFavorite?: boolean | null;
    IsResumable?: boolean | null;
    Is4K?: boolean | null;
    IsHD?: boolean | null;
    IsSD?: boolean | null;
    Is3D?: boolean | null;
    VideoTypes?: string | null;
    SeriesStatus?: string | null;
    HasSubtitles?: boolean | null;
    HasTrailer?: boolean | null;
    HasSpecialFeature?: boolean | null;
    ParentIndexNumber?: boolean | null;
    HasThemeSong?: boolean | null;
    HasThemeVideo?: boolean | null;
    GenreIds?: string | null;
    NameLessThan?: string | null;
    NameStartsWith?: string | null;
    StartIndex?: number;
}
