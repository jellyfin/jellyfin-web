import { playbackManager } from 'components/playback/playbackmanager';
import globalize from 'scripts/globalize';
import type { PlayerPlugin } from 'types/plugin';

export default class MuteButton {
    static getHtml() {
        return `<button is="paper-icon-button-light" class="buttonMute autoSize" title=${globalize.translate('Mute')}><span class="xlargePaperIconButton material-icons volume_up" aria-hidden="true"></span></button>`;
    }

    currentPlayer?: PlayerPlugin | null;

    constructor(context: HTMLElement) {
        context.querySelector('.buttonMute')?.addEventListener('click', () => {
            playbackManager.toggleMute(this.currentPlayer);
        });
    }

    onShow(player: PlayerPlugin|null) {
        this.bindToPlayer(player);
    }

    destroy() {
        this.releaseCurrentPlayer();
    }

    onPlayerChange(player: PlayerPlugin|null) {
        this.bindToPlayer(player);
    }

    updatePlayerVolumeState(context: HTMLElement, showMuteButton: boolean, isMuted?: boolean) {
        const muteButton = context.querySelector('.buttonMute');
        if (!muteButton) return;
        const muteButtonIcon = muteButton.querySelector('.material-icons');
        if (!muteButtonIcon) return;

        muteButtonIcon.classList.remove('volume_off', 'volume_up');

        if (isMuted) {
            muteButton.setAttribute('title', globalize.translate('Unmute'));
            muteButtonIcon.classList.add('volume_off');
        } else {
            muteButton.setAttribute('title', globalize.translate('Mute'));
            muteButtonIcon.classList.add('volume_up');
        }

        muteButton.classList.toggle('hide', !showMuteButton);
    }

    private releaseCurrentPlayer() {
        const player = this.currentPlayer;

        if (player) {
            this.currentPlayer = null;
        }
    }

    private bindToPlayer(player: PlayerPlugin|null) {
        this.releaseCurrentPlayer();
        this.currentPlayer = player;
    }
}
