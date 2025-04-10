import { MILLISECONDS_PER_MINUTE, TICKS_PER_MILLISECOND, TICKS_PER_MINUTE } from '../../constants/time';
import { StillWatchingAction } from 'apps/stable/features/playback/constants/stillWatchingAction';
import { stillWatchingBehavior } from '../../scripts/settings/userSettings';

function itemIsEpisode (item) {
    return item.Type === 'Episode';
}

function getStillWatchingConfig (setting) {
    switch (setting) {
        case StillWatchingAction.Default: return { episodeCount: 3, minMinutes: 90 };
        case StillWatchingAction.Short: return { episodeCount: 2, minMinutes: 60 };
        case StillWatchingAction.Long: return { episodeCount: 5, minMinutes: 150 };
        case StillWatchingAction.VeryLong: return { episodeCount: 8, minMinutes: 240 };
        default: return null;
    }
}

class IdleManager {
    constructor(playbackManager) {
        this.playbackManager = playbackManager;
        this.episodeCount = 0;
        this.watchTicks = 0;
        this.lastUpdateTicks = 0;
        this.isWatchingEpisodes = false;
        this.episodeWasInterrupted = false;
        this.showStillWatching = false;
        this.stillWatchingShowing = false;
        this.stillWatchingSetting = null;
    }

    notifyStartSession (item, items) {
        // No need to track when only watching 1 episode
        if (itemIsEpisode(item) && items.length > 1) {
            this.resetSession();
            this.episodeWasInterrupted = false;
            this.stillWatchingSetting = getStillWatchingConfig(stillWatchingBehavior());
            this.stillWatchingShowing = false;
        }
    }

    notifyStart (item) {
        if (itemIsEpisode(item)) {
            this.isWatchingEpisodes = true;
        }
    }

    onEpisodeWatched () {
        if (!this.episodeWasInterrupted) {
            this.episodeCount++;
        }
        this.calculateWatchTime();
        this.episodeWasInterrupted = false;
    }

    notifyInteraction (item) {
        if (itemIsEpisode(item)) {
            this.resetSession();
            this.lastUpdateTicks = this.playbackManager.currentTime() * TICKS_PER_MILLISECOND;
            this.episodeWasInterrupted = true;
        }
    }

    notifyPlay (item) {
        if (itemIsEpisode(item)) {
            this.calculateWatchTime();
            this.stillWatchingShowing = false;
        }
    }

    async #checkStillWatchingStatus () {
        // User has disabled the Still Watching feature
        if (!this.stillWatchingSetting) {
            return;
        }

        const minMinutesInMs = this.stillWatchingSetting.minMinutes * MILLISECONDS_PER_MINUTE;

        const episodeRequirementMet = this.episodeCount >= this.stillWatchingSetting.episodeCount - 1;
        const watchTimeRequirementMet = (this.watchTicks / TICKS_PER_MINUTE) >= minMinutesInMs;

        if (episodeRequirementMet || watchTimeRequirementMet) {
            this.showStillWatching = true;
        }
    }

    calculateWatchTime () {
        const currentTimeTicks = this.playbackManager.currentTime() * TICKS_PER_MILLISECOND;
        this.watchTicks += currentTimeTicks - this.lastUpdateTicks;
        this.lastUpdateTicks = currentTimeTicks;
        this.#checkStillWatchingStatus();
    }

    resetSession () {
        this.watchTicks = 0;
        this.episodeCount = 0;
        this.lastUpdateTicks = 0;
        this.showStillWatching = false;
    }
}

export default IdleManager;
