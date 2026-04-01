import { playbackManager } from './playback/playbackmanager';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import globalize from 'lib/globalize';
import confirm from './confirm/confirm';
import toast from './toast/toast';

/**
 * Recycles the currently playing item: confirms with user, advances to
 * the next track (keeping the player UI open), then sends the old file
 * to the Recycle Bin via the plugin API.
 */
export async function recycleCurrentItem(player, nowPlayingItem) {
    if (!nowPlayingItem?.Id) return;

    const apiClient = ServerConnections.getApiClient(nowPlayingItem.ServerId);
    const item = await apiClient.getItem(apiClient.getCurrentUserId(), nowPlayingItem.Id);
    if (!item.CanDelete) return;

    await confirm({
        title: globalize.translate('HeaderDeleteItem'),
        text: globalize.translate('ConfirmDeleteItem'),
        confirmText: globalize.translate('Delete'),
        primary: 'delete'
    });

    // Check if there are more tracks in the queue
    const playlist = await playbackManager.getPlaylist(player);
    const currentIndex = playbackManager.getCurrentPlaylistIndex(player);
    const hasNextTrack = currentIndex < playlist.length - 1;

    if (hasNextTrack) {
        // Advance to next track — keeps player UI open and releases file handle
        await playbackManager.nextTrack(player);
    } else {
        // Last track — must stop, no next track to play
        if (player) {
            await playbackManager.stop(player);
        }
    }

    // Wait for file handle release
    await new Promise(resolve => setTimeout(resolve, 500));

    // Send to recycle bin
    try {
        await apiClient.ajax({
            type: 'POST',
            url: apiClient.getUrl('RecycleBin/' + item.Id)
        });
    } catch {
        toast({ text: globalize.translate('ErrorDeletingItem') });
    }
}
