import actionsheet from '../actionSheet/actionSheet';
import { playbackManager } from './playbackmanager';

export interface PlaybackRate {
    name: string;
    id: number;
}

/**
 * The playback rates offered by the built in html media players.
 */
export const SUPPORTED_PLAYBACK_RATES: PlaybackRate[] = [
    { name: '0.5x', id: 0.5 },
    { name: '0.75x', id: 0.75 },
    { name: '1x', id: 1.0 },
    { name: '1.25x', id: 1.25 },
    { name: '1.5x', id: 1.5 },
    { name: '1.75x', id: 1.75 },
    { name: '2x', id: 2.0 },
    { name: '2.5x', id: 2.5 },
    { name: '3x', id: 3.0 },
    { name: '3.5x', id: 3.5 },
    { name: '4x', id: 4.0 }
];

/**
 * Show the playback rate menu for the current player.
 *
 * Resolves once a rate has been applied and rejects when the menu is dismissed,
 * matching the behavior of the other menus in playersettingsmenu.
 */
export function showPlaybackRateMenu(player: unknown, positionTo: Element | null) {
    const rates: PlaybackRate[] | undefined = playbackManager.getSupportedPlaybackRates(player);

    // Remote players (eg. cast targets) do not implement playback rates
    if (!rates?.length) {
        return Promise.reject(new Error('Player does not support playback rates'));
    }

    const currentRate = playbackManager.getPlaybackRate(player);
    const menuItems = rates.map(rate => ({
        id: String(rate.id),
        name: rate.name,
        selected: rate.id === currentRate
    }));

    return actionsheet.show({
        items: menuItems,
        positionTo
    }).then(function (id) {
        if (typeof id === 'string' && id) {
            playbackManager.setPlaybackRate(parseFloat(id), player);
            return Promise.resolve();
        }

        return Promise.reject(new Error('No playback rate selected'));
    });
}
