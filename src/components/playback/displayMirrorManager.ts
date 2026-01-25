import { getItemQuery } from 'hooks/useItem';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { toApi } from 'utils/jellyfin-apiclient/compat';
import { queryClient } from 'utils/query/queryClient';

import { playbackManager } from './playbackmanager';

async function mirrorIfEnabled(serverId: string, itemId: string) {
    if (playbackManager.enableDisplayMirroring()) {
        const playerInfo = playbackManager.getPlayerInfo();

        if (playerInfo && !playerInfo.isLocalPlayer && playerInfo.supportedCommands.indexOf('DisplayContent') !== -1) {
            const apiClient = ServerConnections.getApiClient(serverId);
            const api = toApi(apiClient);
            const userId = apiClient.getCurrentUserId();

            try {
                const item = await queryClient.fetchQuery(getItemQuery(api, itemId, userId));

                playbackManager.displayContent({
                    ItemName: item.Name,
                    ItemId: item.Id,
                    ItemType: item.Type
                });
            } catch (err) {
                console.error('[DisplayMirrorManager] failed to mirror item', err);
            }
        }
    }
}

document.addEventListener('viewshow', e => {
    const { serverId, id } = e.detail?.params || {};
    if (serverId && id) {
        void mirrorIfEnabled(serverId, id);
    }
});
