import { ServerConnections } from '../../lib/jellyfin-apiclient';

export function played(id: string, serverId: string, isPlayed: boolean): Promise<any> {
    const apiClient = ServerConnections.getApiClient(serverId);
    if (!apiClient) return Promise.reject(new Error('Missing apiClient'));
    const method = isPlayed ? 'markPlayed' : 'markUnplayed';
    return (apiClient as any)[method](apiClient.getCurrentUserId(), id, new Date());
}

export function favorite(id: string, serverId: string, isFavorite: boolean): Promise<any> {
    const apiClient = ServerConnections.getApiClient(serverId);
    if (!apiClient) return Promise.reject(new Error('Missing apiClient'));
    return apiClient.updateFavoriteStatus(apiClient.getCurrentUserId(), id, isFavorite);
}

const userdatabuttons = { played, favorite };
export default userdatabuttons;
