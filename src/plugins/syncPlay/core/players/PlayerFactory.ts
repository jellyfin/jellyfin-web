/**
 * Module that creates wrappers for known players.
 * @module components/syncPlay/core/players/PlayerFactory
 */

import GenericPlayer from './GenericPlayer';

/**
 * Class that creates wrappers for known players.
 */
class PlayerFactory {
    constructor() {
        this.wrappers = {};
        this.DefaultWrapper = GenericPlayer;
    }

    /**
     * Registers a wrapper to the list of players that can be managed.
     * @param {typeof GenericPlayer} wrapperClass The wrapper to register.
     */
    registerWrapper(wrapperClass) {
        console.debug('SyncPlay WrapperFactory registerWrapper:', wrapperClass.type);
        this.wrappers[wrapperClass.type] = wrapperClass;
    }

    /**
     * Sets the default player wrapper.
     * @param {typeof GenericPlayer} wrapperClass The wrapper.
     */
    setDefaultWrapper(wrapperClass) {
        console.debug('SyncPlay WrapperFactory setDefaultWrapper:', wrapperClass.type);
        this.DefaultWrapper = wrapperClass;
    }

    /**
     * Gets a player wrapper that manages the given player. Default wrapper is used for unknown players.
     * @param {Object} player The player to handle.
     * @param {SyncPlayManager} syncPlayManager The SyncPlay manager.
     * @returns The player wrapper.
     */
    getWrapper(player, syncPlayManager) {
        if (!player) {
            console.debug('SyncPlay WrapperFactory getWrapper: using default wrapper.');
            return this.getDefaultWrapper(syncPlayManager);
        }

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
     * @param {SyncPlayManager} syncPlayManager The SyncPlay manager.
     * @returns The default player wrapper.
     */
    getDefaultWrapper(syncPlayManager) {
        if (this.DefaultWrapper) {
            return new this.DefaultWrapper(null, syncPlayManager);
        } else {
            return null;
        }
    }
}

export default PlayerFactory;
