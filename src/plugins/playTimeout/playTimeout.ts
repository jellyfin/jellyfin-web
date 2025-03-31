import globalize from '../../lib/globalize';
import * as userSettings from '../../scripts/settings/userSettings';
import alert from '../../components/alert';
import { PluginType } from '../../types/plugin';
import { PlaybackSubscriber } from '../../apps/stable/features/playback/utils/playbackSubscriber';
import { PlaybackManager } from '../../components/playback/playbackmanager';
import { MediaType } from '@jellyfin/sdk/lib/generated-client/models/media-type';

function showTimeoutMessage() {
    return alert(globalize.translate('MessagePlayTimeoutDescription'), globalize.translate('MessagePlayTimeout'));
}

/**
 * Handles the "Are you still watching?" feature.
 * @class
 */
class PlayTimeout extends PlaybackSubscriber {
    protected name: string;
    protected type: string;
    protected id: string;

    /**
     * The current consecutive episodes watched without interaction - updates at the end of a video.
     * @type {number}
     */
    protected episodeCnt: number;

    /**
     * The current consecutive time spent watching without interaction - updates at the end of a video.
     * @type {number}
     */
    protected watchtime: number;

    /**
     * Tracks the feature state. When false, many events are skipped. When true, all events are enabled.
     * Primarily used to disable/enable playback monitoring between episodes or when the feature is disabled in the user settings.
     * @type {boolean}
     */
    protected enabled: boolean;

    /**
     * Flag that gets set when a timeout is pending.
     * @type {boolean}
     */
    protected timeout: boolean;

    /**
     * Stores time within the same episode where activity was detected in milliseconds.
     * Will be zero if no activity has occured.
     * Will be non-zero if a timeout or activity has occured.
     * @type {number}
     */
    protected timeCache: number;

    /**
     * Creates an instance of PlayTimeout.
     * @param {PlaybackManager} playbackManager The playback manager being monitored.
     */
    constructor(protected readonly playbackManager: PlaybackManager) {
        super(playbackManager);
        this.name = 'Playback timeout';
        this.type = PluginType.PreplayIntercept;
        this.id = 'playtimeout';

        this.episodeCnt = 0;
        this.watchtime = 0;
        this.enabled = false;
        this.timeout = false;
        this.timeCache = 0;

        // set up basic interaction event listeners
        this.interactionHandler = this.interactionHandler.bind(this);
        document.addEventListener('keydown', this.interactionHandler);
        document.addEventListener('click', this.interactionHandler);
        document.addEventListener('touchstart', this.interactionHandler);
        document.addEventListener('mousemove', this.interactionHandler);
        document.addEventListener('wheel', this.interactionHandler);
        document.addEventListener('focusin', this.interactionHandler);
        document.addEventListener('focusout', this.interactionHandler);
    }

    /**
     * Enables this feature.
     * @see PlayTimeout#enabled
     */
    private enable(): void {
        this.enabled = true;
    }

    /**
     * Disables this feature.
     * @see PlayTimeout#enabled
     */
    private disable(): void {
        this.enabled = false;
    }

    /**
    * Resets attributes that track timeouts.
    */
    private resetAttributes(): void {
        this.timeout = false;
        this.episodeCnt = 0;
        this.watchtime = 0;
    }

    /**
    * Handles the logic for when a user interacts with the media player.
    */
    private interactionHandler(): void {
        if (this.enabled) {
            this.resetAttributes();
            this.timeCache = this.getCurEpisodeTime();
        }
    }

    /**
    * Handles the logic when a timeout is triggered.
    */
    private async timeoutHandler() {
        // reset timeout flag and tracker attributes
        this.resetAttributes();
        this.timeCache = this.getCurEpisodeTime();

        // pause the current player
        this.playbackManager.pause();

        // show message
        await showTimeoutMessage();
    }

    /**
    * Checks whether timeouts are enabled - defaults to episodal timeouts unless isTimeoutTimeActive is true.
    * @returns {boolean} Returns true if episode-based timeouts are enabled, false otherwise.
    */
    private isTimeoutActive(): boolean {
        return userSettings.enableStillWatching(undefined);
    }

    /**
    * Checks whether timeouts should occur after a certain amount of time
    * @returns {boolean} Returns true if time-based timeouts are enabled, false otherwise.
    */
    private isTimeoutTimeActive(): boolean {
        return userSettings.timeBasedStillWatching(undefined);
    }

    /**
    * Retrieves the amount of consecutive milliseconds watching before a timeout should occur.
    * @returns {number} Returns the time in milliseconds after which a timeout should occur
    */
    private getTimeoutTime(): number {
        return userSettings.stillWatchingTimeout(undefined) * 6 * (10 ** 4); // convert from minutes to milliseconds
    }

    /**
    * Retrieves the amount of consecutive episodes before a timeout should occur.
    * @returns {number} The number of episodes after which a timeout should occur.
    */
    private getTimeoutEpisodes(): number {
        return userSettings.askAfterNumEpisodes(undefined);
    }

    /**
    * Retrieves the current time of the episode in milliseconds
    * @returns {number} the the current time of the episode in milliseconds, defaulting to zero
    */
    private getCurEpisodeTime(): number {
        return this.playbackManager.currentTime() || 0;
    }

    /**
    * Disables this feature and resets its attributes.
    */
    onPlayerChange(): void {
        this.resetAttributes();
        this.disable();
    }

    /**
    * Enables/disables this feature at start of playback.
    */
    onPlayerPlaybackStart() {
        // check if video and enabled in user settings
        if (this.playbackManager.isPlayingMediaType(MediaType.Video) && this.isTimeoutActive()) {
            // enable feature on videos
            this.enable();
            this.timeCache = 0;
            this.episodeCnt++;
        } else {
            // disable feature on non-videos
            this.disable();
            this.resetAttributes();
        }
    }

    /**
    * Updates watch time and checks whether epidsodal timeout should trigger.
    */
    onPlayerPlaybackStop() {
        if (this.enabled) {
            if (this.isTimeoutActive() && this.isTimeoutTimeActive()) {
                const time = this.getCurEpisodeTime();
                if (time) {
                    this.watchtime += time;
                }
            } else if (this.isTimeoutActive()) {
                if (this.getTimeoutEpisodes() && this.episodeCnt >= this.getTimeoutEpisodes()) {
                    this.timeout = true;
                }
            }
            // need to disable because of repeated triggers of onPlayerPlaybackStop and other events between videos
            this.disable();
        }
    }

    /**
    * Checks whether watch time timeout should trigger and handles calling timeout handler when a timeout is pending.
    */
    async onPlayerTimeUpdate() {
        if (this.enabled) {
            if (this.timeout) {
                await this.timeoutHandler();
            } else if (this.isTimeoutActive() && this.isTimeoutTimeActive()) {
                const time = this.getCurEpisodeTime();
                if (time) {
                    if (this.getTimeoutTime() && (this.watchtime - this.timeCache + time) > this.getTimeoutTime() && this.episodeCnt > 0) {
                        this.timeout = true;
                    }
                }
            }
        }
    }

    /*
        Events that denote user interaction in @playbackSubscriber are used here. The events suppliment the event listeners defined in the constructor.

        TODO: add or remove envents based on how other platforms detect interaction. If just the constructor event listeners are sufficient, remove these.
        If not, there are a lot of interactions missing, like skipping and scrubbing, that should cause the timeout to reset.
    */

    onPlayerFullscreenChange() {
        this.interactionHandler();
    }

    onPlayerItemStarted() {
        this.interactionHandler();
    }

    onPlayerItemStopped() {
        this.interactionHandler();
    }

    onPlayerMediaStreamsChange() {
        this.interactionHandler();
    }

    onPlayerPlaylistItemAdd() {
        this.interactionHandler();
    }

    onPlayerPlaylistItemMove() {
        this.interactionHandler();
    }

    onPlayerPlaylistItemRemove() {
        this.interactionHandler();
    }

    onPromptSkip() {
        this.interactionHandler();
    }

    onPlayerRepeatModeChange() {
        this.interactionHandler();
    }

    onPlayerShuffleModeChange() {
        this.interactionHandler();
    }

    onPlayerUnpause() {
        this.interactionHandler();
    }

    onPlayerVolumeChange() {
        this.interactionHandler();
    }
}

export default PlayTimeout;
export const bindPlayTimeout = (playbackManager: PlaybackManager) => new PlayTimeout(playbackManager);
