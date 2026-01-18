import Events from 'utils/events';

export function updateUserData(card, userData) {
    if (!card || !userData) {
        return;
    }

    Events.trigger(card, 'userdatachange', [userData]);
}
