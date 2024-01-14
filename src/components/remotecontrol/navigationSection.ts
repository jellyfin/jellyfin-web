import { Player } from 'types/player';
import PlaybackCommandButton from './playbackCommandButton';

export default class NavigationSection {
    playbackCommandButtons: PlaybackCommandButton[];

    constructor (context: HTMLElement) {
        this.playbackCommandButtons = [];
        const navigationSection = context.querySelector('.navigationSection');
        const buttons = navigationSection?.querySelectorAll<HTMLButtonElement>('.btnCommand') ?? [];
        for (const button of buttons) {
            this.playbackCommandButtons.push(new PlaybackCommandButton(button));
        }
    }

    onShow(player: Player|null) {
        this.playbackCommandButtons.forEach((playbackCommandButton) => {
            playbackCommandButton.onShow(player);
        });
    }

    destroy() {
        this.playbackCommandButtons.forEach((playbackCommandButton) => {
            playbackCommandButton.destroy();
        });
    }

    updatePlayerState(context: HTMLElement, supportedCommands: string[], player: Player|null) {
        if (supportedCommands.includes('Select') && player && !player.isLocalPlayer) {
            context.querySelector('.navigationSection')?.classList.remove('hide');
        } else {
            context.querySelector('.navigationSection')?.classList.add('hide');
        }
    }

    onPlayerChange(player: Player|null) {
        this.playbackCommandButtons.forEach((playbackCommandButton) => {
            playbackCommandButton.onPlayerChange(player);
        });
    }
}
