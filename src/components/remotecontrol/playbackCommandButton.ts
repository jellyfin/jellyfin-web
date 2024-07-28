import { playbackManager } from 'components/playback/playbackmanager';
import type { PlayerPlugin } from 'types/plugin';

export default class PlaybackCommandButton {
    currentPlayer?: PlayerPlugin | null;
    btnCommand: HTMLButtonElement;

    constructor (context: HTMLButtonElement) {
        this.btnCommand = context;
        this.btnCommand.addEventListener('click', this.onBtnCommandClick);
    }

    private onBtnCommandClick = () => {
        if (this.currentPlayer) {
            playbackManager.sendCommand({
                Name: this.btnCommand.getAttribute('data-command')
            }, this.currentPlayer);
        }
    };

    onShow(player: PlayerPlugin|null) {
        this.bindToPlayer(player);
    }

    destroy() {
        this.releaseCurrentPlayer();
    }

    onPlayerChange(player: PlayerPlugin|null) {
        this.bindToPlayer(player);
    }

    private bindToPlayer(player: PlayerPlugin|null) {
        this.releaseCurrentPlayer();
        this.currentPlayer = player;
        if (player) {
            const playerInfo = playbackManager.getPlayerInfo();
            const supportedCommands = playerInfo?.supportedCommands || [];
            this.updateSupportedCommands(supportedCommands);
        }
    }

    private releaseCurrentPlayer() {
        const player = this.currentPlayer;

        if (player) {
            this.currentPlayer = null;
        }
    }

    private updateSupportedCommands(commands: string[]) {
        const command = this.btnCommand.getAttribute('data-command');
        const enableButton = command ? commands.indexOf(command) !== -1 : false;
        this.btnCommand.disabled = !enableButton;
    }
}
