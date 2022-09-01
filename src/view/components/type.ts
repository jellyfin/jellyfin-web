export type IQuery = {
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
    NameLessThan?: string;
    NameStartsWith?: string;
}

export type ICardOptions = {
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
