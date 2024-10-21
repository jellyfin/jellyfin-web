import type { PlayerPlugin } from 'types/plugin';
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

    onShow(player: PlayerPlugin|null) {
        this.playbackCommandButtons.forEach((playbackCommandButton) => {
            playbackCommandButton.onShow(player);
        });
    }

    destroy() {
        this.playbackCommandButtons.forEach((playbackCommandButton) => {
            playbackCommandButton.destroy();
        });
    }

    updatePlayerState(context: HTMLElement, supportedCommands: string[], player: PlayerPlugin|null) {
        if (supportedCommands.includes('Select') && player && !player.isLocalPlayer) {
            context.querySelector('.navigationSection')?.classList.remove('hide');
        } else {
            context.querySelector('.navigationSection')?.classList.add('hide');
        }
    }

    onPlayerChange(player: PlayerPlugin|null) {
        this.playbackCommandButtons.forEach((playbackCommandButton) => {
            playbackCommandButton.onPlayerChange(player);
        });
    }
}
