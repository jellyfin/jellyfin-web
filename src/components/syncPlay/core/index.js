import * as Helper from './Helper';
import Settings from './Settings';
import ManagerClass from './Manager';
import PlayerFactoryClass from './players/PlayerFactory';
import GenericPlayer from './players/GenericPlayer';

const PlayerFactory = new PlayerFactoryClass();
const Manager = new ManagerClass(PlayerFactory);

export default {
    Helper,
    Settings,
    Manager,
    PlayerFactory,
    Players: {
        GenericPlayer
    }
};
