/**
 * Module that manages the HtmlVideoPlayer for SyncPlay.
 * @module components/syncPlay/ui/players/HtmlVideoPlayer
 */

import NoActivePlayer from './NoActivePlayer';
import Events from '../../../../utils/events.ts';

/**
 * Class that manages the HtmlVideoPlayer for SyncPlay.
 */
class HtmlVideoPlayer extends NoActivePlayer {
    static type = 'htmlvideoplayer';

    constructor(player, syncPlayManager) {
        super(player, syncPlayManager);
        this.isPlayerActive = false;
        this.savedPlaybackRate = 1.0;
        this.minBufferingThresholdMillis = 3000;

        if (player.currentTimeAsync) {
            /**
             * Gets current playback position.
             * @returns {Promise<number>} The player position, in milliseconds.
             */
            this.currentTimeAsync = () => {
                return this.player.currentTimeAsync();
            };
        }

        // Frame stepping constants
        this._frameStepListener = null;
        this._frameDuration = 1 / 25; // Default to 25fps, adjust if you can get actual framerate
    }

    /**
     * Binds to the player's events. Overrides parent method.
     * @param {Object} player The player.
     */
    localBindToPlayer() {
        super.localBindToPlayer();

        const self = this;

        this._onPlaybackStart = (player, state) => {
            self.isPlayerActive = true;
            self.onPlaybackStart(player, state);
        };

        this._onPlaybackStop = (stopInfo) => {
            self.isPlayerActive = false;
            self.onPlaybackStop(stopInfo);
        };

        this._onUnpause = () => {
            self.onUnpause();
        };

        this._onPause = () => {
            self.onPause();
        };

        this._onTimeUpdate = (e) => {
            const currentTime = new Date();
            const currentPosition = self.player.currentTime();
            self.onTimeUpdate(e, {
                currentTime: currentTime,
                currentPosition: currentPosition
            });
        };

        this._onPlaying = () => {
            clearTimeout(self.notifyBuffering);
            self.onReady();
        };

        this._onWaiting = () => {
            clearTimeout(self.notifyBuffering);
            self.notifyBuffering = setTimeout(() => {
                self.onBuffering();
            }, self.minBufferingThresholdMillis);
        };

        Events.on(this.player, 'playbackstart', this._onPlaybackStart);
        Events.on(this.player, 'playbackstop', this._onPlaybackStop);
        Events.on(this.player, 'unpause', this._onUnpause);
        Events.on(this.player, 'pause', this._onPause);
        Events.on(this.player, 'timeupdate', this._onTimeUpdate);
        Events.on(this.player, 'playing', this._onPlaying);
        Events.on(this.player, 'waiting', this._onWaiting);

        this.savedPlaybackRate = this.player.getPlaybackRate();

        // Add frame step keydown listener
        this._frameStepListener = (e) => {
            // Don't interfere with text input
            if (document.activeElement && (
                document.activeElement.tagName === 'INPUT' ||
                document.activeElement.tagName === 'TEXTAREA' ||
                document.activeElement.isContentEditable
            )) return;

            // Only act when paused
            if (!self.player.paused) return;

            // Skip modified keys
            if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) return;

            // Frame step
            if (e.key === '.') {
                e.preventDefault();
                self.player.currentTime += self._frameDuration;
            } else if (e.key === ',') {
                e.preventDefault();
                self.player.currentTime -= self._frameDuration;
            }
        };
        document.addEventListener('keydown', this._frameStepListener);
    }

    /**
     * Removes the bindings from the player's events. Overrides parent method.
     */
    localUnbindFromPlayer() {
        super.localUnbindFromPlayer();

        Events.off(this.player, 'playbackstart', this._onPlaybackStart);
        Events.off(this.player, 'playbackstop', this._onPlaybackStop);
        Events.off(this.player, 'unpause', this._onPlayerUnpause);
        Events.off(this.player, 'pause', this._onPlayerPause);
        Events.off(this.player, 'timeupdate', this._onTimeUpdate);
        Events.off(this.player, 'playing', this._onPlaying);
        Events.off(this.player, 'waiting', this._onWaiting);

        this.player.setPlaybackRate(this.savedPlaybackRate);

        // Remove frame step keydown listener
        if (this._frameStepListener) {
            document.removeEventListener('keydown', this._frameStepListener);
            this._frameStepListener = null;
        }
    }

    /**
     * Called when changes are made to the play queue.
     */
    onQueueUpdate() {
        // TODO: find a more generic event? Tests show that this is working for now.
        Events.trigger(this.player, 'playlistitemadd');
    }

    /**
     * Gets player status.
     * @returns {boolean} Whether the player has some media loaded.
     */
    isPlaybackActive() {
        return this.isPlayerActive;
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
     * Checks if player has playback rate support.
     * @returns {boolean} _true _ if playback rate is supported, false otherwise.
     */
    hasPlaybackRate() {
        return true;
    }

    /**
     * Sets the playback rate, if supported.
     * @param {number} value The playback rate.
     */
    setPlaybackRate(value) {
        this.player.setPlaybackRate(value);
    }

    /**
     * Gets the playback rate.
     * @returns {number} The playback rate.
     */
    getPlaybackRate() {
        return this.player.getPlaybackRate();
    }
}

export default HtmlVideoPlayer;
