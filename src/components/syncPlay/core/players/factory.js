/**
 * Module that creates wrappers for known players.
 * @module components/syncPlay/core/players/factory
 */

import SyncPlayGenericPlayer from './genericPlayer';

/**
 * Class that creates wrappers for known players.
 */
class SyncPlayPlayerFactory {
    constructor() {
        this.wrappers = {};
        this.DefaultWrapper = SyncPlayGenericPlayer;
    }

    /**
     * Registers a wrapper to the list of players that can be managed.
     * @param {SyncPlayGenericPlayer} wrapperClass The wrapper to register.
     */
    registerWrapper(wrapperClass) {
        console.debug('SyncPlay WrapperFactory registerWrapper:', wrapperClass.type);
        this.wrappers[wrapperClass.type] = wrapperClass;
    }

    /**
     * Sets the default player wrapper.
     * @param {SyncPlayGenericPlayer} wrapperClass The wrapper.
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

        console.debug('SyncPlay WrapperFactory getWrapper:', player.id);
        const Wrapper = this.wrappers[player.id];
        if (Wrapper) {
            return new Wrapper(player, syncPlayManager);
        }

        console.debug(`SyncPlay WrapperFactory getWrapper: unknown player ${player.id}, using default wrapper.`);
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

/** SyncPlayPlayerFactory singleton. */
const playerFactory = new SyncPlayPlayerFactory();
export default playerFactory;
