import { playbackManager } from 'components/playback/playbackmanager';
import { appHost } from 'components/apphost';
import Events from 'utils/events.ts';
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

    function onVolumeChanged() {
        const player = this;
        updatePlayerVolumeState(dlg, player.isMuted());
    }

    function onPlaybackStart(e, state) {
        const player = this;
        onStateChanged.call(player, e, state);
    }

    function onPlaybackStopped(e, state) {
        const player = this;

        if (!state.NextMediaType) {
            updatePlayerState(player, dlg, {});
        }
    }

    function onStateChanged(event, state) {
        const player = this;
        updatePlayerState(player, dlg, state);
    }

    function releaseCurrentPlayer() {
        const player = currentPlayer;

        if (player) {
            Events.off(player, 'playbackstart', onPlaybackStart);
            Events.off(player, 'statechange', onStateChanged);
            Events.off(player, 'playbackstop', onPlaybackStopped);
            Events.off(player, 'volumechange', onVolumeChanged);
            currentPlayer = null;
        }
    }

    // TODO: is it nesesery to watch these events? can playState.IsMuted change without click event?
    // TODO: can supportedCommands.Mute change without click event?
    function bindToPlayer(context, player) {
        releaseCurrentPlayer();
        currentPlayer = player;

        if (player) {
            const state = playbackManager.getPlayerState(player);
            onStateChanged.call(player, {
                type: 'init'
            }, state);
            Events.on(player, 'playbackstart', onPlaybackStart);
            Events.on(player, 'statechange', onStateChanged);
            Events.on(player, 'playbackstop', onPlaybackStopped);
            Events.on(player, 'volumechange', onVolumeChanged);
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

    function onPlayerChange() {
        bindToPlayer(dlg, playbackManager.getCurrentPlayer());
    }

    function init(ownerView, context) {
        bindEvents(context);
        Events.on(playbackManager, 'playerchange', onPlayerChange);
    }

    function onDialogClosed() {
        releaseCurrentPlayer();
        Events.off(playbackManager, 'playerchange', onPlayerChange);
    }

    function onShow(context) {
        bindToPlayer(context, playbackManager.getCurrentPlayer());
    }

    let dlg;
    let currentPlayer;
    let currentPlayerSupportedCommands = [];
    const self = this;

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
