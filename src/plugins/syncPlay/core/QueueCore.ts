/**
 * Module that manages the playlist of SyncPlay.
 * @module components/syncPlay/core/QueueCore
 */

import { playbackManager } from '../../../components/playback/playbackmanager';
import { logger } from '../../../utils/logger';

/**
 * Class that manages the playlist of SyncPlay.
 */
class QueueCore {
    manager: any = null;

    init(syncPlayManager: any) {
        this.manager = syncPlayManager;
    }

    updatePlayQueue(apiClient: any, data: any) {
        const serverId = apiClient.serverInfo().Id;
        const currentItem = playbackManager.currentItem(this.manager.currentPlayer);
        const currentPlaylistItemId = currentItem ? currentItem.PlaylistItemId : null;

        if (data.PlaylistItemId === currentPlaylistItemId) {
            logger.debug('SyncPlay: playlist already up to date', { component: 'SyncPlay' });
            return;
        }

        logger.debug('SyncPlay: updating play queue', { component: 'SyncPlay', data });

        playbackManager.play({
            ids: [data.ItemId],
            startPositionTicks: data.StartPositionTicks,
            serverId: serverId,
            mediaSourceId: data.MediaSourceId,
            audioStreamIndex: data.AudioStreamIndex,
            subtitleStreamIndex: data.SubtitleStreamIndex,
            startIndex: 0
        });
    }

    getCurrentPlaylistItemId() {
        const player = this.manager.currentPlayer;
        if (!player) return null;
        const item = playbackManager.currentItem(player);
        return item ? item.PlaylistItemId : null;
    }

    isPlaylistEmpty() {
        const player = this.manager.currentPlayer;
        if (!player) return true;
        return playbackManager.getPlaylistSync(player).length === 0;
    }

    async startPlayback(apiClient: any) {
        const groupInfo = this.manager.getGroupInfo();
        if (!groupInfo) return;

        const serverId = apiClient.serverInfo().Id;
        
        return playbackManager.play({
            ids: [groupInfo.NowPlayingItemId],
            serverId: serverId,
            startPositionTicks: groupInfo.PositionTicks,
            startIndex: 0
        });
    }
}

export { QueueCore };
export default QueueCore;