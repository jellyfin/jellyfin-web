import alert from 'components/alert';
import focusManager from 'components/focusManager';
import { playbackManager } from 'components/playback/playbackmanager';
import { pluginManager } from 'components/pluginManager';
import { appRouter } from 'components/router/appRouter';
import toast from 'components/toast/toast';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import inputManager from 'scripts/inputManager';
import Events from 'utils/events.ts';
import { PluginType } from 'types/plugin.ts';
import { OutboundWebSocketMessageType } from '@jellyfin/sdk/lib/websocket';

function notifyApp() {
    inputManager.notify();
}

function displayMessage(cmd) {
    const args = cmd.Arguments;
    if (args.TimeoutMs) {
        toast({ title: args.Header, text: args.Text });
    } else {
        alert({ title: args.Header, text: args.Text });
    }
}

function displayContent(cmd, apiClient) {
    if (!playbackManager.isPlayingLocally(['Video', 'Book'])) {
        appRouter.showItem(cmd.Arguments.ItemId, apiClient.serverId());
    }
}

function playTrailers(apiClient, itemId) {
    apiClient.getItem(apiClient.getCurrentUserId(), itemId).then(function (item) {
        playbackManager.playTrailers(item);
    });
}

function processGeneralCommand(cmd, apiClient) {
    console.debug('Received command: ' + cmd.Name);
    switch (cmd.Name) {
        case 'Select':
            inputManager.handleCommand('select');
            return;
        case 'Back':
            inputManager.handleCommand('back');
            return;
        case 'MoveUp':
            inputManager.handleCommand('up');
            return;
        case 'MoveDown':
            inputManager.handleCommand('down');
            return;
        case 'MoveLeft':
            inputManager.handleCommand('left');
            return;
        case 'MoveRight':
            inputManager.handleCommand('right');
            return;
        case 'PageUp':
            inputManager.handleCommand('pageup');
            return;
        case 'PageDown':
            inputManager.handleCommand('pagedown');
            return;
        case 'PlayTrailers':
            playTrailers(apiClient, cmd.Arguments.ItemId);
            break;
        case 'SetRepeatMode':
            playbackManager.setRepeatMode(cmd.Arguments.RepeatMode);
            break;
        case 'SetShuffleQueue':
            playbackManager.setQueueShuffleMode(cmd.Arguments.ShuffleMode);
            break;
        case 'VolumeUp':
            inputManager.handleCommand('volumeup');
            return;
        case 'VolumeDown':
            inputManager.handleCommand('volumedown');
            return;
        case 'ChannelUp':
            inputManager.handleCommand('channelup');
            return;
        case 'ChannelDown':
            inputManager.handleCommand('channeldown');
            return;
        case 'Mute':
            inputManager.handleCommand('mute');
            return;
        case 'Unmute':
            inputManager.handleCommand('unmute');
            return;
        case 'ToggleMute':
            inputManager.handleCommand('togglemute');
            return;
        case 'SetVolume':
            notifyApp();
            playbackManager.setVolume(cmd.Arguments.Volume);
            break;
        case 'SetAudioStreamIndex':
            notifyApp();
            playbackManager.setAudioStreamIndex(parseInt(cmd.Arguments.Index, 10));
            break;
        case 'SetSubtitleStreamIndex':
            notifyApp();
            playbackManager.setSubtitleStreamIndex(parseInt(cmd.Arguments.Index, 10));
            break;
        case 'ToggleFullscreen':
            inputManager.handleCommand('togglefullscreen');
            return;
        case 'GoHome':
            inputManager.handleCommand('home');
            return;
        case 'GoToSettings':
            inputManager.handleCommand('settings');
            return;
        case 'DisplayContent':
            displayContent(cmd, apiClient);
            break;
        case 'GoToSearch':
            inputManager.handleCommand('search');
            return;
        case 'DisplayMessage':
            displayMessage(cmd);
            break;
        case 'ToggleOsd':
        case 'ToggleContextMenu':
        case 'SendKey':
            // todo
            break;
        case 'SendString':
            focusManager.sendText(cmd.Arguments.String);
            break;
        default:
            console.debug('processGeneralCommand does not recognize: ' + cmd.Name);
            break;
    }

    notifyApp();
}

function onPlay({ Data }, apiClient) {
    notifyApp();
    const serverId = apiClient.serverInfo().Id;
    if (Data.PlayCommand === 'PlayNext') {
        playbackManager.queueNext({ ids: Data.ItemIds, serverId });
    } else if (Data.PlayCommand === 'PlayLast') {
        playbackManager.queue({ ids: Data.ItemIds, serverId });
    } else {
        playbackManager.play({
            ids: Data.ItemIds,
            startPositionTicks: Data.StartPositionTicks,
            mediaSourceId: Data.MediaSourceId,
            audioStreamIndex: Data.AudioStreamIndex,
            subtitleStreamIndex: Data.SubtitleStreamIndex,
            startIndex: Data.StartIndex,
            serverId
        });
    }
}

function onPlaystate({ Data }) {
    if (Data.Command === 'Stop') {
        inputManager.handleCommand('stop');
    } else if (Data.Command === 'Pause') {
        inputManager.handleCommand('pause');
    } else if (Data.Command === 'Unpause') {
        inputManager.handleCommand('play');
    } else if (Data.Command === 'PlayPause') {
        inputManager.handleCommand('playpause');
    } else if (Data.Command === 'Seek') {
        playbackManager.seek(Data.SeekPositionTicks);
    } else if (Data.Command === 'NextTrack') {
        inputManager.handleCommand('next');
    } else if (Data.Command === 'PreviousTrack') {
        inputManager.handleCommand('previous');
    } else if (Data.Command === 'Rewind') {
        inputManager.handleCommand('rewind');
    } else if (Data.Command === 'FastForward') {
        inputManager.handleCommand('fastforward');
    } else {
        notifyApp();
    }
}

function subscribeToApiClient(apiClient) {
    apiClient.subscribe([OutboundWebSocketMessageType.Play], (msg) => onPlay(msg, apiClient));
    apiClient.subscribe([OutboundWebSocketMessageType.Playstate], (msg) => onPlaystate(msg));
    apiClient.subscribe([OutboundWebSocketMessageType.GeneralCommand], ({ Data }) => processGeneralCommand(Data, apiClient));
    apiClient.subscribe([OutboundWebSocketMessageType.SyncPlayCommand], ({ Data }) => {
        pluginManager.firstOfType(PluginType.SyncPlay)?.instance.Manager.processCommand(Data, apiClient);
    });
    apiClient.subscribe([OutboundWebSocketMessageType.SyncPlayGroupUpdate], ({ Data }) => {
        pluginManager.firstOfType(PluginType.SyncPlay)?.instance.Manager.processGroupUpdate(Data, apiClient);
    });
}

ServerConnections.getApiClients().forEach(subscribeToApiClient);
Events.on(ServerConnections, 'apiclientcreated', function (e, newApiClient) {
    subscribeToApiClient(newApiClient);
});
