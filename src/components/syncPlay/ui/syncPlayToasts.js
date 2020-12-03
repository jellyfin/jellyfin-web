/**
 * Module that notifies user about SyncPlay messages using toasts.
 * @module components/syncPlay/syncPlayToasts
 */

import { Events } from 'jellyfin-apiclient';
import toast from '../../toast/toast';
import globalize from '../../../scripts/globalize';
import SyncPlay from '../core';

/**
 * Class that notifies user about SyncPlay messages using toasts.
 */
class SyncPlayToasts {
    constructor() {
        // Do nothing.
    }

    /**
     * Listens for messages to show.
     */
    init() {
        Events.on(SyncPlay.Manager, 'show-message', (event, data) => {
            const { message, args = [] } = data;
            toast({
                text: globalize.translate(message, ...args)
            });
        });
    }
}

/** SyncPlayToasts singleton. */
const syncPlayToasts = new SyncPlayToasts();
export default syncPlayToasts;
