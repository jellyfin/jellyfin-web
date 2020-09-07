import events from 'events';
import playbackManager from 'playbackManager';

export function supported() {
    return typeof(Storage) !== 'undefined';
}

export function enable(enabled) {
    if (!supported()) return;

    if (enabled) {
        const currentPlayerInfo = playbackManager.getPlayerInfo();

        if (currentPlayerInfo && currentPlayerInfo.id && currentPlayerInfo.id) {
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

    return (currentPlayerInfo && playerId && currentPlayerInfo.id === playerId);
}

function onOpen() {
    if (!supported()) return;

    const playerId = localStorage.getItem('autocastPlayerId');

    playbackManager.getTargets().then(function (targets) {
        for (var i = 0; i < targets.length; i++) {
            if (targets[i].id == playerId) {
                playbackManager.trySetActivePlayer(targets[i].playerName, targets[i]);
                break;
            }
        }
    });
}

const apiClient = window.connectionManager.currentApiClient();
if (apiClient) {
    events.on(apiClient, 'websocketopen', onOpen);
}
