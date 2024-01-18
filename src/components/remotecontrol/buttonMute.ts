import { playbackManager } from 'components/playback/playbackmanager';
import globalize from 'scripts/globalize';
import { Player } from 'types/player';

export default class ButtonMute {
    static getHtml() {
        return `<button is="paper-icon-button-light" class="buttonMute autoSize" title=${globalize.translate('Mute')}><span class="xlargePaperIconButton material-icons volume_up" aria-hidden="true"></span></button>`;
    }

    currentPlayer: Player|null = null;

    constructor(context: HTMLElement) {
        context.querySelector('.buttonMute')?.addEventListener('click', () => {
            playbackManager.toggleMute(this.currentPlayer);
        });
    }

    onShow(player: Player|null) {
        this.bindToPlayer(player);
    }

    destroy() {
        this.releaseCurrentPlayer();
    }

    onPlayerChange(player: Player|null) {
        this.bindToPlayer(player);
    }

    updatePlayerVolumeState(context: HTMLElement, showMuteButton: boolean, isMuted?: boolean) {
        const buttonMute = context.querySelector('.buttonMute');
        if (!buttonMute) return;
        const buttonMuteIcon = buttonMute.querySelector('.material-icons');
        if (!buttonMuteIcon) return;

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

    private releaseCurrentPlayer() {
        const player = this.currentPlayer;

        if (player) {
            this.currentPlayer = null;
        }
    }

    private bindToPlayer(player: Player|null) {
        this.releaseCurrentPlayer();
        this.currentPlayer = player;
    }
}
