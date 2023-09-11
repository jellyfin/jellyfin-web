import { playbackManager } from '../components/playback/playbackmanager';
import ServerConnections from '../components/ServerConnections';
import Events from '../utils/events.ts';

export function supported() {
    return typeof(Storage) !== 'undefined';
}

export function enable(enabled) {
    if (!supported()) return;

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
    if (!supported()) return false;

    const playerId = localStorage.getItem('autocastPlayerId');
    const currentPlayerInfo = playbackManager.getPlayerInfo();

    return playerId && currentPlayerInfo?.id === playerId;
}

function onOpen() {
    const playerId = localStorage.getItem('autocastPlayerId');

    playbackManager.getTargets().then(function (targets) {
        for (const target of targets) {
            if (target.id == playerId) {
                playbackManager.trySetActivePlayer(target.playerName, target);
                break;
            }
        }
    });
}

try {
    const apiClient = ServerConnections.currentApiClient();

    if (apiClient && supported()) {
        Events.on(apiClient, 'websocketopen', onOpen);
    }
} catch (ex) {
    console.warn('Could not get current apiClient', ex);
}
