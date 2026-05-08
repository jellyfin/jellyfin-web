import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';

import confirm from 'components/confirm/confirm';
import { MILLISECONDS_PER_MINUTE } from 'constants/time';
import globalize from 'lib/globalize';
import inputManager from 'scripts/inputManager';
import { type InterceptOptions, PreplayInterceptPlugin } from 'types/plugin';

/** List of item types that should display a still watching prompt. */
const SUPPORTED_ITEM_TYPES: BaseItemKind[] = [
    BaseItemKind.Episode
];

// TODO: These thresholds should be configurable by the user
/** The minimum idle time required before showing the still watching prompt. */
const MIN_IDLE_TIME = 90 * MILLISECONDS_PER_MINUTE; // 90 minutes
/** The number of items that must be played before showing the still watching prompt. */
const MIN_PLAY_COUNT = 3;

class StillWatchingPlugin extends PreplayInterceptPlugin {
    name = 'Still Watching';
    id = 'still-watching';
    priority = 10; // Run after plugins that validate access

    /** The start time of the current play session or since the last reset. */
    private sessionStartTime?: Date;
    /** A set of item IDs that have been played in the current session or since the last reset. */
    private playedItems = new Set<string>();

    /** Resets the play session, clearing the start time and played items. */
    private resetSession() {
        this.sessionStartTime = new Date();
        this.playedItems.clear();
    }

    async intercept({
        isFirstItem,
        item
    }: InterceptOptions) {
        // Reset the session at the start of a new play session
        if (isFirstItem) this.resetSession();

        // Bail if the item is not supported or if it lacks an ID
        if (!item.Id || !item.Type || !SUPPORTED_ITEM_TYPES.includes(item.Type)) return;

        const id = item.Id;
        const idleTime = inputManager.idleTime();
        const sessionDuration = this.sessionStartTime ? new Date().getTime() - this.sessionStartTime.getTime() : 0;

        if (
            // Check that the session has lasted at least the minimum idle time.
            // This prevents the prompt from appearing early for short episodes or skipping episodes.
            sessionDuration >= MIN_IDLE_TIME
            // Check that the user has been idle for at least the minimum idle time or has played at least the minimum
            // number of items.
            && (idleTime >= MIN_IDLE_TIME || this.playedItems.size >= MIN_PLAY_COUNT)
        ) {
            return confirm({
                text: globalize.translate('ConfirmStillWatching'),
                cancelText: globalize.translate('StopWatching'),
                confirmText: globalize.translate('ContinueWatching')
            }).then(() => {
                this.resetSession();
                this.playedItems.add(id);
            });
        }

        this.playedItems.add(id);
    }
}

export default StillWatchingPlugin;
