import globalize from "../../lib/globalize"; // globalized strings for UI elements
import * as userSettings from "../../scripts/settings/userSettings"; // grab user settings (e.g. playtimeoutEnabled)
import alert from "../../components/alert"; // show an alert message to the user if they have been inactive for too long
import { PluginType } from "../../types/plugin";

function showErrorMessage() {
    return alert(globalize.translate("MessagePlayAccessRestricted"));
}

function showTimeoutMessage() {
    // TODO: add globalized message, something like:
    // return alert(globalize.translate("MessagePlayTimeout"));

    return alert("Are you still there?");
}

class PlayAccessValidation {
    constructor() {
        this.name = "Playback timeout";
        this.type = PluginType.PreplayIntercept;
        this.id = "playtimeout";
    }

    intercept(options) {
        // in here, we'll need to handle the logic for checking if the user has been inactive for a certain period of time
        item = options.item;

        if (!item) {
            return Promise.resolve();
        }

        // just spitballing here, this isn't accurate for determining if the user is still active
        // but the general flow is to check if the user has been inactive for a certain period of time
        // then show a message to the user if they have been inactive for too long
        // lemme know if you have any ideas on how to change this
        // - simon

        const playtimeoutEnabled = userSettings.get("playtimeoutEnabled");
        if (!playtimeoutEnabled) {
            return Promise.resolve();
        }

        const timeoutType = userSettings.get("playtimeoutType");
        if (timeoutType === "inactive") {
            const timeout = userSettings.get("playtimeoutInactive");
            const lastActive = userSettings.get("lastInteraction"); // note: this metric won't be here (obviously), but we'll need to get it somewhere (@matt)
            if (!lastActive) {
                return Promise.resolve();
            }

            const now = Date.now();
            const diff = now - lastActive;
            if (diff > timeout) {
                return showTimeoutMessage();
            }
        } else if (timeoutType === "episodes") {
            const episodeLimit = userSettings.get("playtimeoutEpisodes");
            const lastInteraction = userSettings.get("lastInteraction"); // same note as in the inactive case
            const episodeCount = userSettings.get("episodesWatched");
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
}

export default PlayTimeout;
