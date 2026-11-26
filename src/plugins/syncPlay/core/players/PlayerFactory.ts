/**
 * Module that creates wrappers for known players.
 * @module plugins/syncPlay/core/players/PlayerFactory
 */

import type { PlayerPlugin } from '@/types/plugin';

import GenericPlayer from './GenericPlayer';
import type Manager from '../Manager';

/**
 * A media player plugin, as seen by SyncPlay.
 */
export interface SyncPlayPlayer extends PlayerPlugin {
    /**
     * The `type` of the wrapper to use instead of the one matching the player `id`.
     * Lets external players (e.g. native shells) reuse the wrapper of a built-in player.
     */
    syncPlayWrapAs?: string;
}

/**
 * Class that creates wrappers for known players.
 */
class PlayerFactory {
    /** The registered wrappers, keyed by their `type`. */
    private readonly wrappers: Partial<Record<string, typeof GenericPlayer>>;
    private DefaultWrapper: typeof GenericPlayer;

    constructor() {
        this.wrappers = {};
        this.DefaultWrapper = GenericPlayer;
    }

    /**
     * Registers a wrapper to the list of players that can be managed.
     * @param wrapperClass The wrapper to register.
     */
    registerWrapper(wrapperClass: typeof GenericPlayer) {
        console.debug('SyncPlay WrapperFactory registerWrapper:', wrapperClass.type);
        this.wrappers[wrapperClass.type] = wrapperClass;
    }

    /**
     * Sets the default player wrapper.
     * @param wrapperClass The wrapper.
     */
    setDefaultWrapper(wrapperClass: typeof GenericPlayer) {
        console.debug('SyncPlay WrapperFactory setDefaultWrapper:', wrapperClass.type);
        this.DefaultWrapper = wrapperClass;
    }

    /**
     * Gets a player wrapper that manages the given player. Default wrapper is used for unknown players.
     * @param player The player to handle.
     * @param syncPlayManager The SyncPlay manager.
     * @returns The player wrapper.
     */
    getWrapper(player: SyncPlayPlayer | null | undefined, syncPlayManager: Manager): GenericPlayer {
        if (!player) {
            console.debug('SyncPlay WrapperFactory getWrapper: using default wrapper.');
            return this.getDefaultWrapper(syncPlayManager);
        }

        // NOTE: `||` is intentional so that an empty `syncPlayWrapAs` falls back to the player ID.
        const playerId = player.syncPlayWrapAs || player.id;

        console.debug('SyncPlay WrapperFactory getWrapper:', playerId);
        const Wrapper = this.wrappers[playerId];
        if (Wrapper) {
            return new Wrapper(player, syncPlayManager);
        }

        console.debug(`SyncPlay WrapperFactory getWrapper: unknown player ${playerId}, using default wrapper.`);
        return this.getDefaultWrapper(syncPlayManager);
    }

    /**
     * Gets the default player wrapper.
     * @param syncPlayManager The SyncPlay manager.
     * @returns The default player wrapper.
     */
    getDefaultWrapper(syncPlayManager: Manager): GenericPlayer {
        return new this.DefaultWrapper(null, syncPlayManager);
    }
}

export default PlayerFactory;
