import globalize from '../../lib/globalize'; // globalized strings for UI elements
import * as userSettings from '../../scripts/settings/userSettings'; // grab user settings (e.g. playtimeoutEnabled)
import alert from '../../components/alert'; // show an alert message to the user if they have been inactive for too long
import { PluginType } from '../../types/plugin';
import { PlaybackSubscriber } from '../../apps/stable/features/playback/utils/playbackSubscriber';
import { PlayerEvent } from '../../apps/stable/features/playback/constants/playerEvent';
import { PlaybackManagerEvent } from '../../apps/stable/features/playback/constants/playbackManagerEvent';
import { PlaybackManager } from '../../components/playback/playbackmanager';
import { MediaType } from '@jellyfin/sdk/lib/generated-client/models/media-type';
import { ItemMediaKind } from '../../types/base/models/item-media-kind';

function showErrorMessage() {
    return alert(globalize.translate('MessagePlayAccessRestricted'));
}

function showTimeoutMessage() {
    // TODO: add globalized message, something like:
    // return alert(globalize.translate('MessagePlayTimeout'));

    return alert('Are you still there?');
}

/*
    TODO:
          Change to typescript.
*/
class PlayTimeout extends PlaybackSubscriber {
    constructor(playbackManager) {
        super(playbackManager);
        this.name = 'Playback timeout';
        this.type = PluginType.PreplayIntercept;
        this.id = 'playtimeout';

        this.episodeCnt = 0; // the current consecutive episodes watched without interaction - updates at the end of a video
        this.watchtime = 0; // the current consecutive time spent watching without interaction - updates at the end of a video
        this.enabled = false; // this attribute has no bearing on whether the user has the feature enabled; it tracks the state of the feature
        this.timeout = false; // flag that gets set when a timeout is pending

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

    enable() {
        this.enabled = true;
    }

    disable() {
        this.enabled = false;
    }

    /*
        Name: resetAttributes
        Description: Resets attributes that track timeouts.
    */
    resetAttributes() {
        this.timeout = false;
        this.episodeCnt = 0;
        this.watchtime = 0;
    }

    /*
        Name: interactionHandler
        Description: Handles the logic when a user interacts with the media player.
    */
    interactionHandler() {
        // events sometimes happen between videos (e.g. unpause), so this check is required
        if (this.enabled) {
            this.resetAttributes();
        }
    }

    /*
        Name: timeoutHandler
        Description: Handles the logic when a timeout is triggered.
    */
    timeoutHandler() {
        // reset timeout flag and tracker attributes
        this.resetAttributes();

        // pause the current player
        this.player.pause();

        // show message
        showTimeoutMessage();
    }

    /*
        Name: isTimeoutTimeActive
        Description: checks whether timeouts should occur after a certain amount of time
        Returns: boolean - true if time-based timeouts are enabled, false otherwise
    */
    isTimeoutTimeActive() {
        // return userSettings.get('playtimeoutTimeActive');
        return true;
    }

    /*
        Name: isTimeoutEpisodeActive
        Description: checks whether timeouts should occur after a certain amount of episodes
        Returns: boolean - true if episode-based timeouts are enabled, false otherwise
    */
    isTimeoutEpisodeActive() {
        // return userSettings.get('playtimeoutEpisodeActive');
        return true;
    }

    /*
        Name: getTimeoutTime
        Description: retrieves the amount of consecutive milliseconds watching before a timeout should occur
        Returns: int - time in milliseconds after which a timeout should occur
    */
    getTimeoutTime() {
        // return userSettings.get('playtimeoutTime');
        return 10000;
    }

    /*
        Name: getTimeoutEpisodes
        Description: retrieves the amount of consecutive episodes before a timeout should occur
        Returns: int - number of episodes after which a timeout should occur (e.g. 3 means after 3 consectutive episodes)
    */
    getTimeoutEpisodes() {
        // return userSettings.get('playtimeoutEpisodes');
        return 3;
    }

    /*
        Name: getCurEpisodeTime
        Description: gets the current time of the episode in milliseconds
    */
    getCurEpisodeTime() {
        return this.playbackManager.currentTime(this.player) || null;
    }

    /*
        Name: onPlayerChange
        Description: Disables this plugin feature.
    */
    onPlayerChange() {
        this.resetAttributes();
        this.disable();
    }

    /*
        Name: onPlayerPlaybackStart
        Description: Enables/disables this plugin feature at start of playback.
    */
    onPlayerPlaybackStart() {
        // check if video
        if (this.playbackManager.isPlayingMediaType(MediaType.Video) && this.isTimeoutEpisodeActive && this.isTimeoutTimeActive()) {
            // enable feature on videos
            this.enable();
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
            if (this.isTimeoutTimeActive()) {
                const time = this.getCurEpisodeTime();
                if (time) {
                    this.watchtime += time;
                }
            }
            if (this.isTimeoutEpisodeActive()) {
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
    onPlayerTimeUpdate() {
        if (this.enabled) {
            if (this.timeout) {
                this.timeoutHandler();
            } else {
                const time = this.getCurEpisodeTime();
                if (time) {
                    if (this.getTimeoutTime() && this.watchtime + time > this.getTimeoutTime() && this.episodeCnt > 0) {
                        this.timeout = true;
                    }
                }
            }
        }
    }

    /*
    intercept(options) {
        // in here, we'll need to handle the logic for checking if the user has been inactive for a certain period of time
        const item = options.item;

        if (!item) {
            return Promise.resolve();
        }

        // just spitballing here, this isn't accurate for determining if the user is still active
        // but the general flow is to check if the user has been inactive for a certain period of time
        // then show a message to the user if they have been inactive for too long
        // lemme know if you have any ideas on how to change this
        // - simon

        const playtimeoutEnabled = userSettings.get('playtimeoutEnabled');
        if (!playtimeoutEnabled) {
            return Promise.resolve();
        }

        const timeoutType = userSettings.get('playtimeoutType');
        if (timeoutType === 'inactive') {
            const timeout = userSettings.get('playtimeoutInactive');
            const lastActive = userSettings.get('lastInteraction'); // note: this metric won't be here (obviously), but we'll need to get it somewhere (@matt)
            if (!lastActive) {
                return Promise.resolve();
            }

            const now = Date.now();
            const diff = now - lastActive;
            if (diff > timeout) {
                return showTimeoutMessage();
            }
        } else if (timeoutType === 'episodes') {
            const episodeLimit = userSettings.get('playtimeoutEpisodes');
            const lastInteraction = userSettings.get('lastInteraction'); // same note as in the inactive case
            const episodeCount = userSettings.get('episodesWatched');
            if (!lastInteraction) {
                return Promise.resolve();
            }

            const now = Date.now();
            const timeSinceInteraction = now - lastInteraction;
            if (episodeCount >= episodeLimit && timeSinceInteraction > 0) {
                return showTimeoutMessage();
            }
        }

        return Promise.resolve();
    }
    */
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
export const bindPlayTimeout = (playbackManager) => new PlayTimeout(playbackManager);
