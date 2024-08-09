import { playbackManager } from '../components/playback/playbackmanager';
import Events from '../utils/events.ts';

export function enable(enabled) {
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

    playbackManager.getTargets().then(function (targets) {
        for (const target of targets) {
            if (target.id == playerId) {
                playbackManager.trySetActivePlayer(target.playerName, target);
                break;
            }
        }
    });
}

export function initialize(apiClient) {
    if (apiClient) {
        Events.on(apiClient, 'websocketopen', onOpen);
    } else {
        console.warn('[autoCast] cannot initialize missing apiClient');
    }
}
