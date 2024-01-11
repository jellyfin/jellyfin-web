import { playbackManager } from 'components/playback/playbackmanager';
import { appHost } from 'components/apphost';
import globalize from 'scripts/globalize';

let showMuteButton = true;

export function getButtonMuteHtml() {
    return `<button is="paper-icon-button-light" class="buttonMute autoSize" title=${globalize.translate('Mute')}><span class="xlargePaperIconButton material-icons volume_up" aria-hidden="true"></span></button>`;
}

export default function () {
    function updatePlayerState(player, context, state) {
        const playerInfo = playbackManager.getPlayerInfo();
        const supportedCommands = playerInfo.supportedCommands;
        currentPlayerSupportedCommands = supportedCommands;
        const playState = state.PlayState || {};

        updatePlayerVolumeState(context, playState.IsMuted);
    }

    function updatePlayerVolumeState(context, isMuted) {
        const supportedCommands = currentPlayerSupportedCommands;

        if (supportedCommands.indexOf('Mute') === -1) {
            showMuteButton = false;
        }

        if (currentPlayer.isLocalPlayer && appHost.supports('physicalvolumecontrol')) {
            showMuteButton = false;
        }

        const buttonMute = context.querySelector('.buttonMute');
        const buttonMuteIcon = buttonMute.querySelector('.material-icons');

        buttonMuteIcon.classList.remove('volume_off', 'volume_up');

        if (isMuted) {
            buttonMute.setAttribute('title', globalize.translate('Unmute'));
            buttonMuteIcon.classList.add('volume_off');
        } else {
            buttonMute.setAttribute('title', globalize.translate('Mute'));
            buttonMuteIcon.classList.add('volume_up');
        }

        buttonMute.classList.toggle('hide', !showMuteButton);
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
        context.querySelector('.buttonMute').addEventListener('click', function () {
            playbackManager.toggleMute(currentPlayer);
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

    // TODO: is it nesesery to watch these events? can playState.IsMuted change without click event?
    // TODO: can supportedCommands.Mute change without click event?
    self.onVolumeChanged = (player) => {
        updatePlayerVolumeState(dlg, player.isMuted());
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
