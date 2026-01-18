import { ServerConnections } from 'lib/jellyfin-apiclient';
import { modifyQueryWithFilters } from '../utils/queryUtils';

export function getItems(instance, params, currentItem, sortBy, startIndex, limit) {
    return ServerConnections.getApiClient(params.serverId).getItems(params.userId, {
        ParentId: params.parentId,
        IncludeItemTypes: params.IncludeItemTypes,
        SortBy: sortBy,
        SortOrder: 'Ascending',
        StartIndex: startIndex,
        Limit: limit
    });
}

export function getItem(params) {
    return ServerConnections.getApiClient(params.serverId).getItem(params.userId, params.Id);
}
