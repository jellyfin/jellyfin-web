import ButtonMute, { getButtonMuteHtml } from './buttonMute';
import VolumeSlider, { getVolumeSliderHtml } from './volumeSlider';
import { playbackManager } from '../playback/playbackmanager';
import { appHost } from 'components/apphost';

export function getVolumeControlHtml() {
    let volumecontrolHtml = '<div class="volumecontrol flex align-items-center flex-wrap-wrap justify-content-center">';
    volumecontrolHtml += getButtonMuteHtml();
    volumecontrolHtml += getVolumeSliderHtml();
    volumecontrolHtml += '</div>';
    return volumecontrolHtml;
}

let showMuteButton = true;
let showVolumeSlider = true;

export default function () {
    function updatePlayerState(player, context) {
        const playerInfo = playbackManager.getPlayerInfo();
        const supportedCommands = playerInfo.supportedCommands;
        currentPlayerSupportedCommands = supportedCommands;

        updatePlayerVolumeState(context);
    }

    function updatePlayerVolumeState(context) {
        const supportedCommands = currentPlayerSupportedCommands;

        if (supportedCommands.indexOf('Mute') === -1) {
            showMuteButton = false;
        }

        if (supportedCommands.indexOf('SetVolume') === -1) {
            showVolumeSlider = false;
        }

        if (currentPlayer.isLocalPlayer && appHost.supports('physicalvolumecontrol')) {
            showMuteButton = false;
            showVolumeSlider = false;
        }

        if (!showMuteButton && !showVolumeSlider) {
            context.querySelector('.volumecontrol').classList.add('hide');
        }
    }

    function onVolumeChanged() {
        const player = this;
        updatePlayerVolumeState(dlg);
        buttonMute.onVolumeChanged(player);
        volumeSlider.onVolumeChanged(player);
    }

    function releaseCurrentPlayer() {
        const player = currentPlayer;

        if (player) {
            Events.off(player, 'volumechange', onVolumeChanged);
            currentPlayer = null;
        }
    }

    function bindToPlayer(context, player) {
        releaseCurrentPlayer();
        currentPlayer = player;

        if (player) {
            Events.on(player, 'volumechange', onVolumeChanged);
            const playerInfo = playbackManager.getPlayerInfo();
            const supportedCommands = playerInfo.supportedCommands;
            currentPlayerSupportedCommands = supportedCommands;
        }
    }

    function onDialogClosed() {
        releaseCurrentPlayer();
    }

    function onShow(context) {
        bindToPlayer(context, playbackManager.getCurrentPlayer());
    }

    let dlg;
    let currentPlayer;
    let currentPlayerSupportedCommands = [];
    const buttonMute = new ButtonMute();
    const volumeSlider = new VolumeSlider();
    const self = this;

    self.onPlaybackStopped = function (player, e, state) {
        buttonMute.onPlaybackStopped(player, e, state);
        volumeSlider.onPlaybackStopped(player, e, state);
        if (!state.NextMediaType) {
            updatePlayerState(player, dlg);
        }
    };

    self.onStateChanged = function (player, event, state) {
        updatePlayerState(player, dlg);
        buttonMute.onStateChanged(player, event, state);
        volumeSlider.onStateChanged(player, event, state);
    };

    self.onPlayerChange = function (context, player) {
        bindToPlayer(context, player);
        buttonMute.onPlayerChange(context, player);
        volumeSlider.onPlayerChange(context, player);
    };

    self.init = function (ownerView, context) {
        dlg = context;
        buttonMute.init(ownerView, context);
        volumeSlider.init(ownerView, context);
    };

    self.onShow = function () {
        buttonMute.onShow();
        volumeSlider.onShow();
        onShow(dlg);
    };

    self.destroy = function () {
        buttonMute.destroy();
        volumeSlider.destroy();
        onDialogClosed();
    };
}
