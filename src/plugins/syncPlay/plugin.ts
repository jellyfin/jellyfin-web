import { Events } from 'jellyfin-apiclient';

import { playbackManager } from '../../components/playback/playbackmanager';
import ServerConnections from '../../components/ServerConnections';
import SyncPlay from './core';
import SyncPlayNoActivePlayer from './ui/players/NoActivePlayer';
import SyncPlayHtmlVideoPlayer from './ui/players/HtmlVideoPlayer';
import SyncPlayHtmlAudioPlayer from './ui/players/HtmlAudioPlayer';

class SyncPlayPlugin {
    name: string;
    id: string;
    type: string;
    priority: number;

    constructor() {
        this.name = 'SyncPlay Plugin';
        this.id = 'syncplay';
        // NOTE: This should probably be a "mediaplayer" so the playback manager can handle playback logic, but
        // SyncPlay needs refactored so it does not have an independent playback manager.
        this.type = 'syncplay';
        this.priority = 1;

        this.init();
    }

    init() {
        // Register player wrappers.
        SyncPlay.PlayerFactory.setDefaultWrapper(SyncPlayNoActivePlayer);
        SyncPlay.PlayerFactory.registerWrapper(SyncPlayHtmlVideoPlayer);
        SyncPlay.PlayerFactory.registerWrapper(SyncPlayHtmlAudioPlayer);

        // Listen for player changes.
        Events.on(playbackManager, 'playerchange', (_, newPlayer) => {
            SyncPlay.Manager.onPlayerChange(newPlayer);
        });

        // Start SyncPlay.
        const apiClient = ServerConnections.currentApiClient();
        if (apiClient) SyncPlay.Manager.init(apiClient);

        // FIXME: Multiple apiClients?
        Events.on(ServerConnections, 'apiclientcreated', (_, newApiClient) => SyncPlay.Manager.init(newApiClient));
        Events.on(ServerConnections, 'localusersignedin', () => SyncPlay.Manager.updateApiClient(ServerConnections.currentApiClient()));
        Events.on(ServerConnections, 'localusersignedout', () => SyncPlay.Manager.updateApiClient(ServerConnections.currentApiClient()));
    }
}

export default SyncPlayPlugin;
