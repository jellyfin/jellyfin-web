import { playbackManager } from 'components/playback/playbackmanager';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import Events from 'utils/events';
import { logger } from 'utils/logger';
import type { ApiClient } from 'jellyfin-apiclient';

export function enable(enabled: boolean): void {
    logger.debug('cast player', {
        action: enabled ? 'enabling' : 'disabling',
        component: 'autocast'
    });
    if (enabled) {
        const currentPlayerInfo = playbackManager.getPlayerInfo();

        if (currentPlayerInfo?.id) {
            localStorage.setItem('autocastPlayerId', currentPlayerInfo.id);
        }
    } else {
        localStorage.removeItem('autocastPlayerId');
    }
}

export function isEnabled(): boolean {
    const playerId = localStorage.getItem('autocastPlayerId');
    const currentPlayerInfo = playbackManager.getPlayerInfo();

    return Boolean(playerId && currentPlayerInfo?.id === playerId);
}

function onOpen(): void {
    const playerId = localStorage.getItem('autocastPlayerId');
    if (!playerId) {
        logger.debug('no active cast player', { component: 'autocast' });
        return;
    }

    logger.debug('initializing cast player', { playerId, component: 'autocast' });

    playbackManager.getTargets().then(targets => {
        logger.debug('playback targets', { targets, component: 'autocast' });

        const player = targets.find(target => target.id === playerId);
        if (player) {
            logger.debug('found target player', { player, component: 'autocast' });
            playbackManager.trySetActivePlayer(player.playerName, player);
        } else {
            logger.debug('selected cast player not found', { playerId, component: 'autocast' });
        }
    });
}

export function initialize(): void {
    logger.debug('initializing connection listener', { component: 'autocast' });
    ServerConnections.getApiClients().forEach(apiClient => {
        Events.off(apiClient, 'websocketopen', onOpen);
        Events.on(apiClient, 'websocketopen', onOpen);
    });

    Events.on(ServerConnections, 'apiclientcreated', (_e: any, apiClient: ApiClient) => {
        Events.off(apiClient, 'websocketopen', onOpen);
        Events.on(apiClient, 'websocketopen', onOpen);
    });
}
