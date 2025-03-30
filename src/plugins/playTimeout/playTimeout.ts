import globalize from '../../lib/globalize';
import * as userSettings from '../../scripts/settings/userSettings';
import alert from '../../components/alert';
import { PluginType } from '../../types/plugin';
import { PlaybackSubscriber } from '../../apps/stable/features/playback/utils/playbackSubscriber';
import { PlaybackManager } from '../../components/playback/playbackmanager';
import { MediaType } from '@jellyfin/sdk/lib/generated-client/models/media-type';

function showTimeoutMessage() {
    // TODO: add globalized message, something like:
    //return alert(globalize.translate('MessagePlayTimeout'));
    return alert('Are you still there?');
}

class PlayTimeout extends PlaybackSubscriber {
    protected name: string;
    protected type: string;
    protected id: string;

    protected episodeCnt: number; // the current consecutive episodes watched without interaction - updates at the end of a video
    protected watchtime: number; // the current consecutive time spent watching without interaction - updates at the end of a video
    protected enabled: boolean; // this attribute has no bearing on whether the user has the feature enabled; it tracks the state of the feature
    protected timeout: boolean; // flag that gets set when a timeout is pending
    protected timeCache: number; // stores time within the same episode where activity was detected
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

    private enable(): void {
        this.enabled = true;
    }

    private disable(): void {
        this.enabled = false;
    }

    /*
        Name: resetAttributes
        Description: Resets attributes that track timeouts.
    */
    private resetAttributes(): void {
        this.timeout = false;
        this.episodeCnt = 0;
        this.watchtime = 0;
    }

    /*
        Name: interactionHandler
        Description: Handles the logic when a user interacts with the media player.
    */
    private interactionHandler(): void {
        // events sometimes happen between videos (e.g. unpause), so this check is required
        if (this.enabled) {
            this.resetAttributes();
            this.timeCache = this.getCurEpisodeTime();
        }
    }

    /*
        Name: timeoutHandler
        Description: Handles the logic when a timeout is triggered.
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

    /*
    Name: isTimeoutActive
    Description: checks whether timeouts are enabled - defaults to episodal timeouts unless isTimeoutTimeActive is true
    Returns: boolean - true if episode-based timeouts are enabled, false otherwise
    */
    private isTimeoutActive(): boolean {
        return userSettings.get('enableStillWatching')?.toLowerCase() === 'true';
    }

    /*
        Name: isTimeoutTimeActive
        Description: checks whether timeouts should occur after a certain amount of time
        Returns: boolean - true if time-based timeouts are enabled, false otherwise
    */
    private isTimeoutTimeActive(): boolean {
        return userSettings.get('timeBasedStillWatching')?.toLowerCase() === 'true';
    }

    /*
        Name: getTimeoutTime
        Description: retrieves the amount of consecutive milliseconds watching before a timeout should occur
        Returns: int - time in milliseconds after which a timeout should occur
    */
    private getTimeoutTime(): number {
        return Number(userSettings.get('stillWatchingTimout')) * 6 * (10 ** 4); // convert from minutes to milliseconds
    }

    /*
        Name: getTimeoutEpisodes
        Description: retrieves the amount of consecutive episodes before a timeout should occur
        Returns: int - number of episodes after which a timeout should occur (e.g. 3 means after 3 consectutive episodes)
    */
    private getTimeoutEpisodes(): number {
        return Number(userSettings.get('askAfterNumEpisodes'));
    }

    /*
        Name: getCurEpisodeTime
        Description: gets the current time of the episode in milliseconds
        Returns: int - the the current time of the episode in milliseconds, defaulting to zero
    */
    private getCurEpisodeTime(): number {
        return this.playbackManager.currentTime() || 0;
    }

    /*
        Name: onPlayerChange
        Description: Disables this plugin feature.
    */
    onPlayerChange(): void {
        this.resetAttributes();
        this.disable();
    }

    /*
        Name: onPlayerPlaybackStart
        Description: Enables/disables this plugin feature at start of playback.
    */
    onPlayerPlaybackStart() {
        // check if video
        if (this.playbackManager.isPlayingMediaType(MediaType.Video) && this.isTimeoutActive()) {
            // enable feature on videos
            this.enable();
            this.timeCache = 0;
        } else {
            // disable feature on non-videos
            this.disable();
            this.resetAttributes();
        }
    }

    /*
        Name: onPlayerPlaybackStop
        Description: Updates watch time and checks whether epidsodal timeout should trigger.
    */
    onPlayerPlaybackStop() {
        if (this.enabled) {
            this.episodeCnt++;
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

    /*
        Name: onPlayerTimeUpdate
        Description: Checks whether watch time timeout should trigger and handles calling timeout handler.
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
        Events that denote user interaction in @playbackSubscriber are used here. The events suppliment the javascript event listeners defined in the constructor.

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
