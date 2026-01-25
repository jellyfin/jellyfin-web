import GenericPlayer from './GenericPlayer';

class PlayerFactory {
    private wrappers: Record<string, any> = {};
    private DefaultWrapper: any = GenericPlayer;

    registerWrapper(wrapperClass: any) {
        this.wrappers[wrapperClass.type] = wrapperClass;
    }

    setDefaultWrapper(wrapperClass: any) {
        this.DefaultWrapper = wrapperClass;
    }

    getWrapper(player: any, syncPlayManager: any) {
        if (!player) {
            return this.getDefaultWrapper(syncPlayManager);
        }

        const playerId = player.syncPlayWrapAs || player.id;
        const Wrapper = this.wrappers[playerId];
        if (Wrapper) {
            return new Wrapper(player, syncPlayManager);
        }

        return this.getDefaultWrapper(syncPlayManager);
    }

    getDefaultWrapper(syncPlayManager: any) {
        if (this.DefaultWrapper) {
            return new this.DefaultWrapper(null, syncPlayManager);
        }
        return null;
    }
}

export default PlayerFactory;
