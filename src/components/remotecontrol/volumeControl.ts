import ButtonMute from './buttonMute';
import VolumeSlider from './volumeSlider';
import { playbackManager } from 'components/playback/playbackmanager';
import { appHost } from 'components/apphost';
import { Player } from 'types/player';
import Events from 'utils/events';

export default class VolumeControl {
    static getHtml() {
        let volumecontrolHtml = '<div class="volumecontrol flex align-items-center flex-wrap-wrap justify-content-center">';
        volumecontrolHtml += ButtonMute.getHtml();
        volumecontrolHtml += VolumeSlider.getHtml();
        volumecontrolHtml += '</div>';
        return volumecontrolHtml;
    }

    dlg: HTMLElement;
    currentPlayer: Player|null = null;
    currentPlayerSupportedCommands: string[] = [];
    showMuteButton = true;
    showVolumeSlider = true;

    buttonMute;
    volumeSlider;

    constructor(context: HTMLElement) {
        this.dlg = context;
        this.buttonMute = new ButtonMute(context);
        this.volumeSlider = new VolumeSlider(context);
    }

    onShow(player: Player|null) {
        this.buttonMute.onShow(player);
        this.volumeSlider.onShow(player);

        this.bindToPlayer(player);
    }

    destroy() {
        this.buttonMute.destroy();
        this.volumeSlider.destroy();

        this.releaseCurrentPlayer();
    }

    onPlayerChange(player: Player|null) {
        this.bindToPlayer(player);
        this.buttonMute.onPlayerChange(player);
        this.volumeSlider.onPlayerChange(player);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updatePlayerState(context: HTMLElement, state: any) {
        const playerInfo = playbackManager.getPlayerInfo();
        const supportedCommands = playerInfo?.supportedCommands;
        this.currentPlayerSupportedCommands = supportedCommands || [];
        const playState = state?.PlayState || {};

        this.updatePlayerVolumeState(context, playState.IsMuted, playState.VolumeLevel);
    }

    private updatePlayerVolumeState(context: HTMLElement, isMuted?: boolean, volumeLevel?: number) {
        const supportedCommands = this.currentPlayerSupportedCommands;

        if (supportedCommands.indexOf('Mute') === -1) {
            this.showMuteButton = false;
        }

        if (supportedCommands.indexOf('SetVolume') === -1) {
            this.showVolumeSlider = false;
        }

        if (this.currentPlayer?.isLocalPlayer && appHost.supports('physicalvolumecontrol')) {
            this.showMuteButton = false;
            this.showVolumeSlider = false;
        }

        if (!this.showMuteButton && !this.showVolumeSlider) {
            context.querySelector('.volumecontrol')?.classList.add('hide');
        }

        this.buttonMute.updatePlayerVolumeState(context, this.showMuteButton, isMuted);
        this.volumeSlider.updatePlayerVolumeState(context, this.showMuteButton, this.showVolumeSlider, volumeLevel);
    }

    private onVolumeChanged = () => {
        const player = this.currentPlayer;
        this.updatePlayerVolumeState(this.dlg, player?.isMuted?.(), player?.getVolume?.());
    };

    private releaseCurrentPlayer() {
        const player = this.currentPlayer;

        if (player) {
            Events.off(player, 'volumechange', this.onVolumeChanged);
            this.currentPlayer = null;
        }
    }

    private bindToPlayer(player: Player|null) {
        this.releaseCurrentPlayer();
        this.currentPlayer = player;

        if (player) {
            Events.on(player, 'volumechange', this.onVolumeChanged);
            const playerInfo = playbackManager.getPlayerInfo();
            const supportedCommands = playerInfo?.supportedCommands;
            this.currentPlayerSupportedCommands = supportedCommands || [];
        }
    }
}
