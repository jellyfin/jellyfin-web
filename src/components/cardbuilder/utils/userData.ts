import Events from '../../../utils/events';

export function updateUserData(card: HTMLElement, userData: any): void {
    if (!card || !userData) return;
    Events.trigger(card, 'userdatachange', [userData]);
}
