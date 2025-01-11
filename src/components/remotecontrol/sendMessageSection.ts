import { playbackManager } from 'components/playback/playbackmanager';
import toast from 'components/toast/toast';
import globalize from 'scripts/globalize';
import type { PlayerPlugin } from 'types/plugin';

export default class SendMessageSection {
    currentPlayer?: PlayerPlugin | null;

    constructor(context: HTMLElement) {
        context.querySelector('.sendMessageForm')?.addEventListener('submit', this.onMessageSubmit);
    }

    onShow(player: PlayerPlugin|null) {
        this.bindToPlayer(player);
    }

    destroy() {
        this.releaseCurrentPlayer();
    }

    updatePlayerState(context: HTMLElement, supportedCommands: string[]) {
        if (supportedCommands.includes('DisplayMessage') && this.currentPlayer && !this.currentPlayer.isLocalPlayer) {
            context.querySelector('.sendMessageSection')?.classList.remove('hide');
        } else {
            context.querySelector('.sendMessageSection')?.classList.add('hide');
        }
    }

    onPlayerChange(player: PlayerPlugin|null) {
        this.bindToPlayer(player);
    }

    private onMessageSubmit = (e: Event) => {
        if (e.target) {
            const form = e.target as HTMLElement;
            const title = form.querySelector<HTMLInputElement>('#txtMessageTitle');
            const text = form.querySelector<HTMLInputElement>('#txtMessageText');
            if (title && text) {
                playbackManager.sendCommand({
                    Name: 'DisplayMessage',
                    Arguments: {
                        Header: title.value,
                        Text: text.value
                    }
                }, this.currentPlayer);
                title.value = '';
                text.value = '';
            }

            toast(globalize.translate('MessageSent'));
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
