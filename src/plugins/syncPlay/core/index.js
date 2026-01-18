import * as Helper from './Helper';
import ManagerClass from './Manager';
import PlayerFactoryClass from './players/PlayerFactory';
import GenericPlayer from './players/GenericPlayer';

const PlayerFactory = new PlayerFactoryClass();
const Manager = new ManagerClass(PlayerFactory);

export {
    Helper,
    Manager,
    PlayerFactory,
    Players: {
        GenericPlayer
    }
};

// Keep default export for backward compatibility
export default {
    Helper,
    Manager,
    PlayerFactory,
    Players: {
        GenericPlayer
    }
};
