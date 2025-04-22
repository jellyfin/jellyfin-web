import alert from 'components/alert';
import focusManager from 'components/focusManager';
import { playbackManager } from 'components/playback/playbackmanager';
import { pluginManager } from 'components/pluginManager';
import { appRouter } from 'components/router/appRouter';
import toast from 'components/toast/toast';
import ServerConnections from 'lib/jellyfin-apiclient/ServerConnections';
import inputManager from 'scripts/inputManager';
import Events from 'utils/events.ts';
import { PluginType } from 'types/plugin.ts';

const serverNotifications = {};

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

function onMessageReceived(e, msg) {
    const apiClient = this;
    const SyncPlay = pluginManager.firstOfType(PluginType.SyncPlay)?.instance;

    if (msg.MessageType === 'Play') {
        notifyApp();
        const serverId = apiClient.serverInfo().Id;
        if (msg.Data.PlayCommand === 'PlayNext') {
            playbackManager.queueNext({ ids: msg.Data.ItemIds, serverId: serverId });
        } else if (msg.Data.PlayCommand === 'PlayLast') {
            playbackManager.queue({ ids: msg.Data.ItemIds, serverId: serverId });
        } else {
            playbackManager.play({
                ids: msg.Data.ItemIds,
                startPositionTicks: msg.Data.StartPositionTicks,
                mediaSourceId: msg.Data.MediaSourceId,
                audioStreamIndex: msg.Data.AudioStreamIndex,
                subtitleStreamIndex: msg.Data.SubtitleStreamIndex,
                startIndex: msg.Data.StartIndex,
                serverId: serverId
            });
        }
    } else if (msg.MessageType === 'Playstate') {
        if (msg.Data.Command === 'Stop') {
            inputManager.handleCommand('stop');
        } else if (msg.Data.Command === 'Pause') {
            inputManager.handleCommand('pause');
        } else if (msg.Data.Command === 'Unpause') {
            inputManager.handleCommand('play');
        } else if (msg.Data.Command === 'PlayPause') {
            inputManager.handleCommand('playpause');
        } else if (msg.Data.Command === 'Seek') {
            playbackManager.seek(msg.Data.SeekPositionTicks);
        } else if (msg.Data.Command === 'NextTrack') {
            inputManager.handleCommand('next');
        } else if (msg.Data.Command === 'PreviousTrack') {
            inputManager.handleCommand('previous');
        } else {
            notifyApp();
        }
    } else if (msg.MessageType === 'GeneralCommand') {
        const cmd = msg.Data;
        processGeneralCommand(cmd, apiClient);
    } else if (msg.MessageType === 'UserDataChanged') {
        if (msg.Data.UserId === apiClient.getCurrentUserId()) {
            for (let i = 0, length = msg.Data.UserDataList.length; i < length; i++) {
                Events.trigger(serverNotifications, 'UserDataChanged', [apiClient, msg.Data.UserDataList[i]]);
            }
        }
    } else if (msg.MessageType === 'SyncPlayCommand') {
        SyncPlay?.Manager.processCommand(msg.Data, apiClient);
    } else if (msg.MessageType === 'SyncPlayGroupUpdate') {
        SyncPlay?.Manager.processGroupUpdate(msg.Data, apiClient);
    } else {
        Events.trigger(serverNotifications, msg.MessageType, [apiClient, msg.Data]);
    }
}
function bindEvents(apiClient) {
    Events.off(apiClient, 'message', onMessageReceived);
    Events.on(apiClient, 'message', onMessageReceived);
}

ServerConnections.getApiClients().forEach(bindEvents);
Events.on(ServerConnections, 'apiclientcreated', function (e, newApiClient) {
    bindEvents(newApiClient);
});

window.ServerNotifications = serverNotifications;

export default serverNotifications;
