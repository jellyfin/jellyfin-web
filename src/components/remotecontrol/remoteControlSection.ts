import { Player } from 'types/player';
import SendMessageSection from './sendMessageSection';
import SendTextSection from './sendTextSection';
import NavigationSection from './navigationSection';

export default class RemoteControlSection {
    sendMessageSection: SendMessageSection;
    sendTextSection: SendTextSection;
    navigationSection: NavigationSection;

    constructor (context: HTMLElement) {
        this.sendMessageSection = new SendMessageSection(context);
        this.sendTextSection = new SendTextSection(context);
        this.navigationSection = new NavigationSection(context);
    }

    onShow(player: Player|null) {
        this.sendMessageSection.onShow(player);
        this.sendTextSection.onShow(player);
        this.navigationSection.onShow(player);
    }

    destroy() {
        this.sendMessageSection.destroy();
        this.sendTextSection.destroy();
        this.navigationSection.destroy();
    }

    updatePlayerState(context: HTMLElement, supportedCommands: string[], player: Player|null) {
        const isSupportedCommands = supportedCommands.includes('DisplayMessage')
            || supportedCommands.includes('SendString')
            || supportedCommands.includes('Select');

        this.sendMessageSection.updatePlayerState(context, supportedCommands);
        this.sendTextSection.updatePlayerState(context, supportedCommands);
        this.navigationSection.updatePlayerState(context, supportedCommands, player);

        if (isSupportedCommands && player && !player.isLocalPlayer) {
            context.querySelector('.remoteControlSection')?.classList.remove('hide');
        } else {
            context.querySelector('.remoteControlSection')?.classList.add('hide');
        }
    }

    onPlayerChange(player: Player|null) {
        this.sendMessageSection.onPlayerChange(player);
        this.sendTextSection.onPlayerChange(player);
        this.navigationSection.onPlayerChange(player);
    }
}
