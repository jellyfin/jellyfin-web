/**
 * SyncPlay runtime composition root.
 *
 * This file intentionally exports singleton-like instances so the plugin and UI
 * surfaces all operate on one shared SyncPlay manager and player factory.
 */
import * as Helper from './Helper';
import ManagerClass from './Manager';
import PlayerFactoryClass from './players/PlayerFactory';
import GenericPlayer from './players/GenericPlayer';

const PlayerFactory = new PlayerFactoryClass();
const Manager = new ManagerClass(PlayerFactory);

export default {
    Helper,
    Manager,
    PlayerFactory,
    Players: {
        GenericPlayer
    }
};
