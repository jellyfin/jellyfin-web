import { playbackManager } from 'components/playback/playbackmanager';
import toast from 'components/toast/toast';
import globalize from 'scripts/globalize';
import type { PlayerPlugin } from 'types/plugin';

export default class SendTextSection {
    currentPlayer?: PlayerPlugin | null;

    constructor(context: HTMLElement) {
        context.querySelector('.typeTextForm')?.addEventListener('submit', this.onSendStringSubmit);
    }

    onShow(player: PlayerPlugin|null) {
        this.bindToPlayer(player);
    }

    destroy() {
        this.releaseCurrentPlayer();
    }

    updatePlayerState(context: HTMLElement, supportedCommands: string[]) {
        if (supportedCommands.includes('SendString') && this.currentPlayer && !this.currentPlayer.isLocalPlayer) {
            context.querySelector('.sendTextSection')?.classList.remove('hide');
        } else {
            context.querySelector('.sendTextSection')?.classList.add('hide');
        }
    }

    onPlayerChange(player: PlayerPlugin|null) {
        this.bindToPlayer(player);
    }

    private onSendStringSubmit = (e: Event) => {
        if (e.target) {
            const form = e.target as HTMLElement;
            const text = form.querySelector<HTMLInputElement>('#txtTypeText');
            if (text) {
                playbackManager.sendCommand({
                    Name: 'SendString',
                    Arguments: {
                        String: text.value
                    }
                }, this.currentPlayer);
                text.value = '';
            }

            toast(globalize.translate('TextSent'));
        }
        e.preventDefault();
        e.stopPropagation();
        return false;
    };

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
