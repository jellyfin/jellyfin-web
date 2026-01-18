import { getItems } from 'lib/jellyfin-apiclient/legacy';
import { UNLIMITED_ITEMS } from './nameUtils';

export async function getItemsForPlayback(serverId: string, query: any) {
    const apiClient = ServerConnections.getApiClient(serverId);

    if (query.Ids && query.Ids.split(',').length === 1) {
        const itemId = query.Ids.split(',');

        return apiClient.getItem(apiClient.getCurrentUserId(), itemId).then((item: any) => {
            return {
                Items: [item],
                TotalRecordCount: 1
            };
        });
    }

    if (query.Limit === UNLIMITED_ITEMS) {
        delete query.Limit;
    } else {
        query.Limit = query.Limit || 300;
    }

    query.Fields = ['Chapters', 'Trickplay'];
    query.ExcludeLocationTypes = 'Virtual';
    query.EnableTotalRecordCount = false;
    query.CollapseBoxSetItems = false;

    return getItems(apiClient, apiClient.getCurrentUserId(), query);
}
