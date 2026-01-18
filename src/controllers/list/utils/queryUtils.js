export function modifyQueryWithFilters(instance, query) {
    const sortValues = instance.getSortValues();

    if (!query.SortBy) {
        query.SortBy = sortValues.sortBy;
        query.SortOrder = sortValues.sortOrder;
    }

    query.Fields = query.Fields ? query.Fields + ',PrimaryImageAspectRatio' : 'PrimaryImageAspectRatio';
}
