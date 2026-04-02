import { playbackManager } from './playback/playbackmanager';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import globalize from 'lib/globalize';
import confirm from './confirm/confirm';
import toast from './toast/toast';

/**
 * Moves the currently playing item to the "2nd Round" folder on the server:
 * confirms with user, advances to the next track, then calls the MoveToFolder API.
 */
export async function moveCurrentItemToFolder(player, nowPlayingItem) {
    if (!nowPlayingItem?.Id) return;

    const apiClient = ServerConnections.getApiClient(nowPlayingItem.ServerId);
    const item = await apiClient.getItem(apiClient.getCurrentUserId(), nowPlayingItem.Id);
    if (!item.CanDelete) return;

    await confirm({
        title: '2nd Round',
        text: globalize.translate('ConfirmDeleteItem'),
        confirmText: '2nd Round',
        primary: 'delete'
    });

    // Check if there are more tracks in the queue
    const playlist = await playbackManager.getPlaylist(player);
    const currentIndex = playbackManager.getCurrentPlaylistIndex(player);
    const hasNextTrack = currentIndex < playlist.length - 1;

    if (hasNextTrack) {
        await playbackManager.nextTrack(player);
    } else {
        if (player) {
            await playbackManager.stop(player);
        }
    }

    // Wait for file handle release
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
        await apiClient.ajax({
            type: 'POST',
            url: apiClient.getUrl('MoveToFolder/' + item.Id)
        });
    } catch {
        toast({ text: 'Failed to move item to 2nd Round folder' });
    }
}

/**
 * Moves a non-playing item to the "2nd Round" folder (for context menu usage).
 */
export async function moveItemToFolder(apiClient, itemId) {
    try {
        await apiClient.ajax({
            type: 'POST',
            url: apiClient.getUrl('MoveToFolder/' + itemId)
        });
    } catch {
        toast({ text: 'Failed to move item to 2nd Round folder' });
        throw new Error('MoveToFolder failed');
    }
}
