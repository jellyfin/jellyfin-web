import { playbackManager } from 'components/playback/playbackmanager';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import Events from 'utils/events';

export function enable(enabled) {
    console.debug('[autocast] %s cast player', enabled ? 'enabling' : 'disabling');
    if (enabled) {
        const currentPlayerInfo = playbackManager.getPlayerInfo();

        if (currentPlayerInfo?.id) {
            localStorage.setItem('autocastPlayerId', currentPlayerInfo.id);
        }
    } else {
        localStorage.removeItem('autocastPlayerId');
    }
}

export function isEnabled() {
    const playerId = localStorage.getItem('autocastPlayerId');
    const currentPlayerInfo = playbackManager.getPlayerInfo();

    return playerId && currentPlayerInfo?.id === playerId;
}

function onOpen() {
    const playerId = localStorage.getItem('autocastPlayerId');
    if (!playerId) {
        console.debug('[autocast] no active cast player');
        return;
    }

    console.debug('[autocast] initializing cast player', playerId);

    playbackManager.getTargets().then((targets) => {
        console.debug('[autocast] playback targets', targets);

        const player = targets.find(target => target.id === playerId);
        if (player) {
            console.debug('[autocast] found target player', player);
            playbackManager.trySetActivePlayer(player.playerName, player);
        } else {
            console.debug('[autocast] selected cast player not found');
        }
    });
}

export function initialize() {
    console.debug('[autoCast] initializing connection listener');
    ServerConnections.getApiClients().forEach(apiClient => {
        Events.off(apiClient, 'websocketopen', onOpen);
        Events.on(apiClient, 'websocketopen', onOpen);
    });

    Events.on(ServerConnections, 'apiclientcreated', (e, apiClient) => {
        Events.off(apiClient, 'websocketopen', onOpen);
        Events.on(apiClient, 'websocketopen', onOpen);
    });
}
