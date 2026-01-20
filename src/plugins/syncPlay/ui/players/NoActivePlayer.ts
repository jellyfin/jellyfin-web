import { playbackManager } from '../../../../components/playback/playbackmanager';
import QueueManager from './QueueManager';
import GenericPlayer from '../../core/players/GenericPlayer';

class NoActivePlayer extends GenericPlayer {
    static override type = 'default';

    constructor(player: any, syncPlayManager: any) {
        super(player, syncPlayManager);
    }

    localBindToPlayer() {
        if ((playbackManager as any).syncPlayEnabled) return;

        const pm: any = playbackManager;
        // Save local callbacks.
        pm._localPlayPause = pm.playPause;
        pm._localUnpause = pm.unpause;
        pm._localPause = pm.pause;
        pm._localSeek = pm.seek;
        pm._localSendCommand = pm.sendCommand;

        // Override local callbacks.
        pm.playPause = this.playPauseRequest.bind(this);
        pm.unpause = this.unpauseRequest.bind(this);
        pm.pause = this.pauseRequest.bind(this);
        pm.seek = this.seekRequest.bind(this);
        pm.sendCommand = this.sendCommandRequest.bind(this);

        pm._localPlayQueueManager = pm._playQueueManager;
        pm._localPlay = pm.play;
        pm._localSetCurrentPlaylistItem = pm.setCurrentPlaylistItem;
        pm._localClearQueue = pm.clearQueue;
        pm._localRemoveFromPlaylist = pm.removeFromPlaylist;
        pm._localMovePlaylistItem = pm.movePlaylistItem;
        pm._localQueue = pm.queue;
        pm._localQueueNext = pm.queueNext;
        pm._localNextTrack = pm.nextTrack;
        pm._localPreviousTrack = pm.previousTrack;
        pm._localSetRepeatMode = pm.setRepeatMode;
        pm._localSetQueueShuffleMode = pm.setQueueShuffleMode;
        pm._localToggleQueueShuffleMode = pm.toggleQueueShuffleMode;

        pm._playQueueManager = new (QueueManager as any)(this.manager);
        pm.play = this.playRequest.bind(this);
        pm.setCurrentPlaylistItem = this.setCurrentPlaylistItemRequest.bind(this);
        pm.clearQueue = this.clearQueueRequest.bind(this);
        pm.removeFromPlaylist = this.removeFromPlaylistRequest.bind(this);
        pm.movePlaylistItem = this.movePlaylistItemRequest.bind(this);
        pm.queue = this.queueRequest.bind(this);
        pm.queueNext = this.queueNextRequest.bind(this);
        pm.nextTrack = this.nextTrackRequest.bind(this);
        pm.previousTrack = this.previousTrackRequest.bind(this);
        pm.setRepeatMode = this.setRepeatModeRequest.bind(this);
        pm.setQueueShuffleMode = this.setQueueShuffleModeRequest.bind(this);
        pm.toggleQueueShuffleMode = this.toggleQueueShuffleModeRequest.bind(this);

        pm.syncPlayEnabled = true;
    }

    localUnbindFromPlayer() {
        const pm: any = playbackManager;
        if (!pm.syncPlayEnabled) return;

        pm.playPause = pm._localPlayPause;
        pm.unpause = pm._localUnpause;
        pm.pause = pm._localPause;
        pm.seek = pm._localSeek;
        pm.sendCommand = pm._localSendCommand;
        pm._playQueueManager = pm._localPlayQueueManager;
        pm.play = pm._localPlay;
        pm.setCurrentPlaylistItem = pm._localSetCurrentPlaylistItem;
        pm.clearQueue = pm._localClearQueue;
        pm.removeFromPlaylist = pm._localRemoveFromPlaylist;
        pm.movePlaylistItem = pm._localMovePlaylistItem;
        pm.queue = pm._localQueue;
        pm.queueNext = pm._localQueueNext;
        pm.nextTrack = pm._localNextTrack;
        pm.previousTrack = pm._localPreviousTrack;
        pm.setRepeatMode = pm._localSetRepeatMode;
        pm.setQueueShuffleMode = pm._localSetQueueShuffleMode;
        pm.toggleQueueShuffleMode = pm._localToggleQueueShuffleMode;

        pm.syncPlayEnabled = false;
    }

    playPauseRequest() { this.manager.getController().playPause(); }
    unpauseRequest() { this.manager.getController().unpause(); }
    pauseRequest() { this.manager.getController().pause(); }
    seekRequest(positionTicks: number) { this.manager.getController().seek(positionTicks); }

    sendCommandRequest(command: any, player: any) {
        const controller = this.manager.getController();
        const playerWrapper = this.manager.getPlayerWrapper();

        if (command.Name === 'SetRepeatMode') {
            controller.setRepeatMode(command.Arguments.RepeatMode);
        } else if (command.Name === 'SetShuffleQueue') {
            controller.setShuffleMode(command.Arguments.ShuffleMode);
        } else if (command.Name !== 'PlaybackRate') {
            playerWrapper.localSendCommand(command, player);
        }
    }

    localUnpause() { (playbackManager as any)._localUnpause(this.player); }
    localPause() { (playbackManager as any)._localPause(this.player); }
    localSeek(positionTicks: number) { (playbackManager as any)._localSeek(positionTicks, this.player); }
    localStop() { playbackManager.stop(this.player); }
    localSendCommand(cmd: any) { (playbackManager as any)._localSendCommand(cmd, this.player); }

    playRequest(options: any) { return this.manager.getController().play(options); }
    setCurrentPlaylistItemRequest(playlistItemId: string) { this.manager.getController().setCurrentPlaylistItem(playlistItemId); }
    clearQueueRequest(clearPlayingItem: boolean) { this.manager.getController().clearPlaylist(clearPlayingItem); }
    removeFromPlaylistRequest(playlistItemIds: string[]) { this.manager.getController().removeFromPlaylist(playlistItemIds); }
    movePlaylistItemRequest(playlistItemId: string, newIndex: number) { this.manager.getController().movePlaylistItem(playlistItemId, newIndex); }
    queueRequest(options: any) { this.manager.getController().queue(options); }
    queueNextRequest(options: any) { this.manager.getController().queueNext(options); }
    nextTrackRequest() { this.manager.getController().nextItem(); }
    previousTrackRequest() { this.manager.getController().previousItem(); }
    setRepeatModeRequest(mode: string) { this.manager.getController().setRepeatMode(mode); }
    setQueueShuffleModeRequest(mode: string) { this.manager.getController().setShuffleMode(mode); }
    toggleQueueShuffleModeRequest() { this.manager.getController().toggleShuffleMode(); }

    localPlay(options: any) { return (playbackManager as any)._localPlay(options); }
    localSetCurrentPlaylistItem(playlistItemId: string) { return (playbackManager as any)._localSetCurrentPlaylistItem(playlistItemId, this.player); }
    localRemoveFromPlaylist(playlistItemIds: string[]) { return (playbackManager as any)._localRemoveFromPlaylist(playlistItemIds, this.player); }
    localMovePlaylistItem(playlistItemId: string, newIndex: number) { return (playbackManager as any)._localMovePlaylistItem(playlistItemId, newIndex, this.player); }
    localQueue(options: any) { return (playbackManager as any)._localQueue(options, this.player); }
    localQueueNext(options: any) { return (playbackManager as any)._localQueueNext(options, this.player); }
    localNextItem() { (playbackManager as any)._localNextTrack(this.player); }
    localPreviousItem() { (playbackManager as any)._localPreviousTrack(this.player); }
    localSetRepeatMode(value: string) { (playbackManager as any)._localSetRepeatMode(value, this.player); }
    localSetQueueShuffleMode(value: string) { (playbackManager as any)._localSetQueueShuffleMode(value, this.player); }
    localToggleQueueShuffleMode() { (playbackManager as any)._localToggleQueueShuffleMode(this.player); }
}

export default NoActivePlayer;