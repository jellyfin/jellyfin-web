import { playbackManager } from 'components/playback/playbackmanager';
import { appHost } from 'components/apphost';

export function getVolumeSliderHtml() {
    return '<div class="sliderContainer nowPlayingVolumeSliderContainer"><input is="emby-slider" type="range" step="1" min="0" max="100" value="0" class="nowPlayingVolumeSlider"/></div>';
}

let showMuteButton = true;
let showVolumeSlider = true;

export default function () {
    function updatePlayerState(player, context, state) {
        const playerInfo = playbackManager.getPlayerInfo();
        const supportedCommands = playerInfo.supportedCommands;
        currentPlayerSupportedCommands = supportedCommands;
        const playState = state.PlayState || {};

        updatePlayerVolumeState(context, playState.IsMuted, playState.VolumeLevel);
    }

    function updatePlayerVolumeState(context, isMuted, volumeLevel) {
        const supportedCommands = currentPlayerSupportedCommands;

        // TODO: shouldn't we set showMuteButton nad showVolumeSlider to true before checking conditions below?

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

        if (showMuteButton || showVolumeSlider) {
            const nowPlayingVolumeSlider = context.querySelector('.nowPlayingVolumeSlider');
            const nowPlayingVolumeSliderContainer = context.querySelector('.nowPlayingVolumeSliderContainer');

            if (nowPlayingVolumeSlider) {
                nowPlayingVolumeSliderContainer.classList.toggle('hide', !showVolumeSlider);

                if (!nowPlayingVolumeSlider.dragging) {
                    nowPlayingVolumeSlider.value = volumeLevel || 0;
                }
            }
        }
    }

    function releaseCurrentPlayer() {
        const player = currentPlayer;

        if (player) {
            currentPlayer = null;
        }
    }

    function bindToPlayer(context, player) {
        releaseCurrentPlayer();
        currentPlayer = player;

        if (player) {
            const playerInfo = playbackManager.getPlayerInfo();
            const supportedCommands = playerInfo.supportedCommands;
            currentPlayerSupportedCommands = supportedCommands;
        }
    }

    function bindEvents(context) {
        context.querySelector('.nowPlayingVolumeSlider').addEventListener('input', (e) => {
            playbackManager.setVolume(e.target.value, currentPlayer);
        });
    }

    function init(ownerView, context) {
        bindEvents(context);
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
    const self = this;

    self.onVolumeChanged = (player) => {
        updatePlayerVolumeState(dlg, player.isMuted(), player.getVolume());
    };

    self.onPlaybackStopped = (player, e, state) => {
        if (!state.NextMediaType) {
            updatePlayerState(player, dlg, {});
        }
    };

    self.onStateChanged = (player, event, state) => {
        updatePlayerState(player, dlg, state);
    };

    self.onPlayerChange = function (context, player) {
        bindToPlayer(context, player);
    };

    self.init = function (ownerView, context) {
        dlg = context;
        init(ownerView, dlg);
    };

    self.onShow = function () {
        onShow(dlg);
    };

    self.destroy = function () {
        onDialogClosed();
    };
}
