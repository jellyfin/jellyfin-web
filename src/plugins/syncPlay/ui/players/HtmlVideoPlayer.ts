import Events from '../../../../utils/events';
import NoActivePlayer from './NoActivePlayer';

class HtmlVideoPlayer extends NoActivePlayer {
    static override type = 'htmlvideoplayer';

    isPlayerActive: boolean = false;
    savedPlaybackRate: number = 1.0;
    minBufferingThresholdMillis: number = 3000;
    private notifyBuffering: any = null;

    private _onPlaybackStart: any;
    private _onPlaybackStop: any;
    private _onUnpause: any;
    private _onPause: any;
    private _onTimeUpdate: any;
    private _onPlaying: any;
    private _onWaiting: any;

    constructor(player: any, syncPlayManager: any) {
        super(player, syncPlayManager);
    }

    override localBindToPlayer() {
        super.localBindToPlayer();

        this._onPlaybackStart = (player: any, state: any) => {
            this.isPlayerActive = true;
            this.onPlaybackStart(player, state);
        };

        this._onPlaybackStop = (stopInfo: any) => {
            this.isPlayerActive = false;
            this.onPlaybackStop(stopInfo);
        };

        this._onUnpause = () => this.onUnpause();
        this._onPause = () => this.onPause();

        this._onTimeUpdate = (e: any) => {
            this.onTimeUpdate(e, {
                currentTime: new Date(),
                currentPosition: this.player.currentTime()
            });
        };

        this._onPlaying = () => {
            clearTimeout(this.notifyBuffering);
            this.onReady();
        };

        this._onWaiting = () => {
            clearTimeout(this.notifyBuffering);
            this.notifyBuffering = setTimeout(() => {
                this.onBuffering();
            }, this.minBufferingThresholdMillis);
        };

        Events.on(this.player, 'playbackstart', this._onPlaybackStart);
        Events.on(this.player, 'playbackstop', this._onPlaybackStop);
        Events.on(this.player, 'unpause', this._onUnpause);
        Events.on(this.player, 'pause', this._onPause);
        Events.on(this.player, 'timeupdate', this._onTimeUpdate);
        Events.on(this.player, 'playing', this._onPlaying);
        Events.on(this.player, 'waiting', this._onWaiting);

        this.savedPlaybackRate = this.player.getPlaybackRate();
    }

    override localUnbindFromPlayer() {
        super.localUnbindFromPlayer();

        Events.off(this.player, 'playbackstart', this._onPlaybackStart);
        Events.off(this.player, 'playbackstop', this._onPlaybackStop);
        Events.off(this.player, 'unpause', this._onUnpause);
        Events.off(this.player, 'pause', this._onPause);
        Events.off(this.player, 'timeupdate', this._onTimeUpdate);
        Events.off(this.player, 'playing', this._onPlaying);
        Events.off(this.player, 'waiting', this._onWaiting);

        this.player.setPlaybackRate(this.savedPlaybackRate);
    }

    override isPlaybackActive(): boolean {
        return this.isPlayerActive;
    }
    override isPlaying(): boolean {
        return !this.player.paused();
    }
    override currentTime(): number {
        return this.player.currentTime();
    }
    override hasPlaybackRate(): boolean {
        return true;
    }
    override setPlaybackRate(value: number) {
        this.player.setPlaybackRate(value);
    }
    override getPlaybackRate(): number {
        return this.player.getPlaybackRate();
    }
}

export default HtmlVideoPlayer;
