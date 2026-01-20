import Events from '../../../../utils/events';

export abstract class GenericPlayer {
    static type = 'generic';
    
    player: any;
    manager: any;
    playbackCore: any;
    queueCore: any;
    bound: boolean = false;

    constructor(player: any, syncPlayManager: any) {
        this.player = player;
        this.manager = syncPlayManager;
        this.playbackCore = syncPlayManager.getPlaybackCore();
        this.queueCore = syncPlayManager.getQueueCore();
    }

    bindToPlayer() {
        if (this.bound) return;
        this.localBindToPlayer();
        this.bound = true;
    }

    abstract localBindToPlayer(): void;

    unbindFromPlayer() {
        if (!this.bound) return;
        this.localUnbindFromPlayer();
        this.bound = false;
    }

    abstract localUnbindFromPlayer(): void;

    onPlaybackStart(player: any, state: any) {
        this.playbackCore.onPlaybackStart(player, state);
        Events.trigger(this, 'playbackstart', [player, state]);
    }

    onPlaybackStop(stopInfo: any) {
        this.playbackCore.onPlaybackStop(stopInfo);
        Events.trigger(this, 'playbackstop', [stopInfo]);
    }

    onUnpause() {
        this.playbackCore.onUnpause();
        Events.trigger(this, 'unpause', [this.player]);
    }

    onPause() {
        this.playbackCore.onPause();
        Events.trigger(this, 'pause', [this.player]);
    }

    onTimeUpdate(event: any, timeUpdateData: any) {
        this.playbackCore.onTimeUpdate(event, timeUpdateData);
        Events.trigger(this, 'timeupdate', [event, timeUpdateData]);
    }

    onReady() {
        this.playbackCore.onReady();
        Events.trigger(this, 'ready');
    }

    onBuffering() {
        this.playbackCore.onBuffering();
        Events.trigger(this, 'buffering');
    }

    isPlaybackActive(): boolean { return false; }
    isPlaying(): boolean { return false; }
    currentTime(): number { return 0; }
    hasPlaybackRate(): boolean { return false; }
    setPlaybackRate(_value: number): void {}
    getPlaybackRate(): number { return 1.0; }
    isRemote(): boolean { return false; }

    abstract localUnpause(): void;
    abstract localPause(): void;
    abstract localSeek(positionTicks: number): void;
    abstract localStop(): void;
    abstract localSendCommand(command: any): void;
    abstract localPlay(options: any): Promise<void>;
    abstract localSetCurrentPlaylistItem(playlistItemId: string): void;
    abstract localRemoveFromPlaylist(playlistItemIds: string[]): void;
    abstract localMovePlaylistItem(playlistItemId: string, newIndex: number): void;
    abstract localQueue(options: any): void;
    abstract localQueueNext(options: any): void;
    abstract localNextItem(): void;
    abstract localPreviousItem(): void;
    abstract localSetRepeatMode(value: string): void;
    abstract localSetQueueShuffleMode(value: string): void;
    abstract localToggleQueueShuffleMode(): void;
}

export default GenericPlayer;