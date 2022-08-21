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
    Limit:number;
    NameLessThan?: string;
    NameStartsWith?: string;
}
