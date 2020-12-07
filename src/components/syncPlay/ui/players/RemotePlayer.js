/**
 * Module that manages the RemotePlayer for SyncPlay.
 * @module components/syncPlay/ui/players/RemotePlayer
 */

import { playbackManager } from '../../../playback/playbackmanager';
import NoActivePlayer from './NoActivePlayer';

/**
 * Class that manages the RemotePlayer for SyncPlay.
 */
class RemotePlayer extends NoActivePlayer {
    static type = 'remoteplayer';

    constructor(player, syncPlayManager) {
        super(player, syncPlayManager);
    }

    getRemoteSessionId() {
        const info = playbackManager.getPlayerInfo();
        return info ? info.id : null;
    }

    joinGroup() {
        const apiClient = this.manager.getApiClient();
        const sessionId = this.getRemoteSessionId();
        const groupInfo = this.manager.getGroupInfo();
        this.remoteSessionId = sessionId;

        apiClient.joinSyncPlayGroup({
            GroupId: groupInfo.GroupId,
            RemoteSessionId: this.remoteSessionId
        }).then(() => {
            // This client won't be playing any media.
            return apiClient.requestSyncPlaySetIgnoreWait({
                IgnoreWait: true
            });
        });
    }

    leaveGroup() {
        const apiClient = this.manager.getApiClient();
        apiClient.leaveSyncPlayGroup({
            RemoteSessionId: this.remoteSessionId
        });
    }

    /**
     * Gets player status.
     * @returns {boolean} Whether the player has some media loaded.
     */
    isPlaybackActive() {
        return this.player.isPlaying();
    }

    /**
     * Gets playback status.
     * @returns {boolean} Whether the playback is unpaused.
     */
    isPlaying() {
        return !this.player.paused();
    }

    /**
     * Gets playback position.
     * @returns {number} The player position, in milliseconds.
     */
    currentTime() {
        return this.player.currentTime();
    }

    /**
     * Whether the player is remotely self-managed.
     * @returns {boolean} _true_ if the player is remotely self-managed, _false_ otherwise.
     */
    isRemote() {
        return true;
    }

    localUnpause() {
        // Override NoActivePlayer.
    }

    localPause() {
        // Override NoActivePlayer.
    }

    localSeek() {
        // Override NoActivePlayer.
    }

    localStop() {
        // Override NoActivePlayer.
    }

    localSendCommand() {
        // Override NoActivePlayer.
    }

    localPlay() {
        // Override NoActivePlayer.
    }

    localSetCurrentPlaylistItem() {
        // Override NoActivePlayer.
    }

    localRemoveFromPlaylist() {
        // Override NoActivePlayer.
    }

    localMovePlaylistItem() {
        // Override NoActivePlayer.
    }

    localQueue() {
        // Override NoActivePlayer.
    }

    localQueueNext() {
        // Override NoActivePlayer.
    }

    localNextTrack() {
        // Override NoActivePlayer.
    }

    localPreviousTrack() {
        // Override NoActivePlayer.
    }

    localSetRepeatMode() {
        // Override NoActivePlayer.
    }

    localSetQueueShuffleMode() {
        // Override NoActivePlayer.
    }

    localToggleQueueShuffleMode() {
        // Override NoActivePlayer.
    }
}

export default RemotePlayer;
