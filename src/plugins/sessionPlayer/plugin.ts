import { playbackManager } from '../../components/playback/playbackmanager';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import serverNotifications from '../../scripts/serverNotifications';
import { PluginType } from '../../types/plugin';
import Events from '../../utils/events';
import { isEqual } from '../../utils/lodashUtils';

function getActivePlayerId() {
    const info = playbackManager.getPlayerInfo();
    return info ? info.id : null;
}

function sendPlayCommand(apiClient: any, options: any, playType: string) {
    const sessionId = getActivePlayerId();
    const ids = options.ids || options.items.map((i: any) => i.Id);

    const remoteOptions: any = {
        ItemIds: ids.join(','),
        PlayCommand: playType
    };

    if (options.startPositionTicks) remoteOptions.StartPositionTicks = options.startPositionTicks;
    if (options.mediaSourceId) remoteOptions.MediaSourceId = options.mediaSourceId;
    if (options.audioStreamIndex != null) remoteOptions.AudioStreamIndex = options.audioStreamIndex;
    if (options.subtitleStreamIndex != null) remoteOptions.SubtitleStreamIndex = options.subtitleStreamIndex;
    if (options.startIndex != null) remoteOptions.StartIndex = options.startIndex;

    return apiClient.sendPlayCommand(sessionId, remoteOptions);
}

function sendPlayStateCommand(apiClient: any, command: string, options?: any) {
    const sessionId = getActivePlayerId();
    apiClient.sendPlayStateCommand(sessionId, command, options);
}

function getCurrentApiClient(instance: SessionPlayer) {
    return ServerConnections.currentApiClient();
}

function sendCommandByName(instance: SessionPlayer, name: string, options?: any) {
    const command: any = { Name: name };
    if (options) command.Arguments = options;
    instance.sendCommand(command);
}

function unsubscribeFromPlayerUpdates(instance: SessionPlayer) {
    instance.isUpdating = false;
    const apiClient = getCurrentApiClient(instance);
    if (apiClient) {
        apiClient.sendMessage('SessionsStop');
    }
    if (instance.pollInterval) {
        clearInterval(instance.pollInterval);
        instance.pollInterval = null;
    }
}

function normalizeImages(session: any, apiClient: any) {
    if (session?.NowPlayingItem) {
        const item = session.NowPlayingItem;
        if (!item.ImageTags?.Primary && item.PrimaryImageTag) {
            item.ImageTags = item.ImageTags || {};
            item.ImageTags.Primary = item.PrimaryImageTag;
        }
        if (!item.ServerId) {
            item.ServerId = apiClient.serverId();
        }
    }
}

class SessionPlayer {
    name: string = 'Remote Control';
    type: any = PluginType.MediaPlayer;
    id: string = 'remoteplayer';
    isLocalPlayer: boolean = false;

    playlist: any[] = [];
    isPlaylistRendered: boolean = true;
    isUpdatingPlaylist: boolean = false;
    lastPlayerData: any = null;
    playerListenerCount: number = 0;
    isUpdating: boolean = false;
    pollInterval: any = null;
    lastPlaylistItemId: string | null = null;

    constructor() {
        Events.on(serverNotifications, 'Sessions', (_e: any, apiClient: any, data: any) => {
            this.processUpdatedSessions(data, apiClient);
        });
    }

    beginPlayerUpdates() {
        if (this.playerListenerCount <= 0) {
            this.playerListenerCount = 0;
            this.subscribeToPlayerUpdates();
        }
        this.playerListenerCount++;
    }

    endPlayerUpdates() {
        this.playerListenerCount--;
        if (this.playerListenerCount <= 0) {
            unsubscribeFromPlayerUpdates(this);
            this.playerListenerCount = 0;
        }
    }

    private subscribeToPlayerUpdates() {
        this.isUpdating = true;
        const apiClient = getCurrentApiClient(this);
        if (!apiClient) return;
        apiClient.sendMessage('SessionsStart', '100,800');
        if (this.pollInterval) clearInterval(this.pollInterval);
        this.pollInterval = setInterval(() => this.onPollIntervalFired(), 5000);
    }

    private onPollIntervalFired() {
        const apiClient = getCurrentApiClient(this);
        if (!apiClient) return;
        if (!apiClient.isMessageChannelOpen()) {
            apiClient.getSessions().then((sessions: any) => {
                this.processUpdatedSessions(sessions, apiClient);
            });
        }
    }

    private processUpdatedSessions(sessions: any[], apiClient: any) {
        const currentTargetId = getActivePlayerId();
        const session = sessions.find(s => s.Id === currentTargetId);

        if (session) {
            normalizeImages(session, apiClient);
            this.lastPlayerData = session;
            Events.trigger(this, 'statechange', [session]);
        } else {
            this.lastPlayerData = null;
            playbackManager.setDefaultPlayerActive();
        }
    }

    getTargets(): Promise<any[]> {
        const apiClient = getCurrentApiClient(this);
        const sessionQuery = { ControllableByUserId: apiClient.getCurrentUserId() };

        return apiClient.getSessions(sessionQuery).then((sessions: any[]) => {
            return sessions
                .filter(s => s.DeviceId !== apiClient.deviceId())
                .map(s => ({
                    name: s.DeviceName,
                    deviceName: s.DeviceName,
                    deviceType: s.DeviceType,
                    id: s.Id,
                    playerName: this.name,
                    appName: s.Client,
                    playableMediaTypes: s.PlayableMediaTypes,
                    isLocalPlayer: false,
                    supportedCommands: s.Capabilities.SupportedCommands,
                    user: s.UserId
                        ? {
                              Id: s.UserId,
                              Name: s.UserName,
                              PrimaryImageTag: s.UserPrimaryImageTag
                          }
                        : null
                }));
        });
    }

    sendCommand(command: any) {
        const sessionId = getActivePlayerId();
        const apiClient = getCurrentApiClient(this);
        apiClient.sendCommand(sessionId, command);
    }

    play(options: any) {
        const playOptions = { ...options };
        if (playOptions.items) {
            playOptions.ids = playOptions.items.map((i: any) => i.Id);
            playOptions.items = null;
        }
        return sendPlayCommand(getCurrentApiClient(this), playOptions, 'PlayNow');
    }

    stop() {
        sendPlayStateCommand(getCurrentApiClient(this), 'stop');
    }
    pause() {
        sendPlayStateCommand(getCurrentApiClient(this), 'Pause');
    }
    unpause() {
        sendPlayStateCommand(getCurrentApiClient(this), 'Unpause');
    }
    seek(ticks: number) {
        sendPlayStateCommand(getCurrentApiClient(this), 'seek', { SeekPositionTicks: ticks });
    }

    currentTime(val?: number) {
        if (val != null) return this.seek(val * 10000);
        return (this.lastPlayerData?.PlayState?.PositionTicks || 0) / 10000;
    }

    duration() {
        return this.lastPlayerData?.NowPlayingItem?.RunTimeTicks || 0;
    }
}

export default SessionPlayer;
