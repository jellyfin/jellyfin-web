import events from 'events';
import connectionManager from 'connectionManager';
import playbackManager from 'playbackManager';
import syncplayManager from 'syncplayManager';
import loading from 'loading';
import toast from 'toast';
import actionsheet from 'actionsheet';
import globalize from 'globalize';
import playbackPermissionManager from 'playbackPermissionManager';

/**
 * Gets active player id.
 * @returns {string} The player's id.
 */
function getActivePlayerId () {
    var info = playbackManager.getPlayerInfo();
    return info ? info.id : null;
}

/**
 * Used when user needs to join a group.
 * @param {HTMLElement} button - Element where to place the menu.
 * @param {Object} user - Current user.
 * @param {Object} apiClient - ApiClient.
 */
function showNewJoinGroupSelection (button, user, apiClient) {
    const sessionId = getActivePlayerId() || 'none';
    const inSession = sessionId !== 'none';
    const policy = user.localUser ? user.localUser.Policy : {};
    let playingItemId;
    try {
        const playState = playbackManager.getPlayerState();
        playingItemId = playState.NowPlayingItem.Id;
        console.debug('Item', playingItemId, 'is currently playing.');
    } catch (error) {
        playingItemId = '';
        console.debug('No item is currently playing.');
    }

    apiClient.sendSyncplayCommand(sessionId, 'ListGroups').then(function (response) {
        response.json().then(function (groups) {
            var menuItems = groups.map(function (group) {
                return {
                    name: group.PlayingItemName,
                    icon: 'group',
                    id: group.GroupId,
                    selected: false,
                    secondaryText: group.Participants.join(', ')
                };
            });

            if (inSession && policy.SyncplayAccess === 'CreateAndJoinGroups') {
                menuItems.push({
                    name: globalize.translate('LabelSyncplayNewGroup'),
                    icon: 'add',
                    id: 'new-group',
                    selected: true,
                    secondaryText: globalize.translate('LabelSyncplayNewGroupDescription')
                });
            }

            if (menuItems.length === 0) {
                if (inSession && policy.SyncplayAccess === 'JoinGroups') {
                    toast({
                        text: globalize.translate('MessageSyncplayCreateGroupDenied')
                    });
                } else {
                    toast({
                        text: globalize.translate('MessageSyncplayNoGroupsAvailable')
                    });
                }
                loading.hide();
                return;
            }

            var menuOptions = {
                title: globalize.translate('HeaderSyncplaySelectGroup'),
                items: menuItems,
                positionTo: button,
                resolveOnClick: true,
                border: true
            };

            actionsheet.show(menuOptions).then(function (id) {
                if (id == 'new-group') {
                    apiClient.sendSyncplayCommand(sessionId, 'NewGroup');
                } else {
                    apiClient.sendSyncplayCommand(sessionId, 'JoinGroup', {
                        GroupId: id,
                        PlayingItemId: playingItemId
                    });
                }
            }).catch((error) => {
                console.error('Syncplay: unexpected error listing groups:', error);
            });

            loading.hide();
        });
    }).catch(function (error) {
        console.error(error);
        loading.hide();
        toast({
            text: globalize.translate('MessageSyncplayErrorAccessingGroups')
        });
    });
}

/**
 * Used when user has joined a group.
 * @param {HTMLElement} button - Element where to place the menu.
 * @param {Object} user - Current user.
 * @param {Object} apiClient - ApiClient.
 */
function showLeaveGroupSelection (button, user, apiClient) {
    const sessionId = getActivePlayerId();
    if (!sessionId) {
        syncplayManager.signalError();
        toast({
            text: globalize.translate('MessageSyncplayErrorNoActivePlayer')
        });
        showNewJoinGroupSelection(button, user, apiClient);
        return;
    }

    const menuItems = [{
        name: globalize.translate('LabelSyncplayLeaveGroup'),
        icon: 'meeting_room',
        id: 'leave-group',
        selected: true,
        secondaryText: globalize.translate('LabelSyncplayLeaveGroupDescription')
    }];

    var menuOptions = {
        title: globalize.translate('HeaderSyncplayEnabled'),
        items: menuItems,
        positionTo: button,
        resolveOnClick: true,
        border: true
    };

    actionsheet.show(menuOptions).then(function (id) {
        if (id == 'leave-group') {
            apiClient.sendSyncplayCommand(sessionId, 'LeaveGroup');
        }
    }).catch((error) => {
        console.error('Syncplay: unexpected error showing group menu:', error);
    });

    loading.hide();
}

// Register to Syncplay events
let syncplayEnabled = false;
events.on(syncplayManager, 'enabled', function (e, enabled) {
    syncplayEnabled = enabled;
});

/**
 * Shows a menu to handle Syncplay groups.
 * @param {HTMLElement} button - Element where to place the menu.
 */
export function show (button) {
    loading.show();

    // TODO: should feature be disabled if playback permission is missing?
    playbackPermissionManager.check().then(() => {
        console.debug('Playback is allowed.');
    }).catch((error) => {
        console.error('Playback not allowed!', error);
        toast({
            text: globalize.translate('MessageSyncplayPlaybackPermissionRequired')
        });
    });

    const apiClient = connectionManager.currentApiClient();
    connectionManager.user(apiClient).then((user) => {
        if (syncplayEnabled) {
            showLeaveGroupSelection(button, user, apiClient);
        } else {
            showNewJoinGroupSelection(button, user, apiClient);
        }
    }).catch((error) => {
        console.error(error);
        loading.hide();
        toast({
            text: globalize.translate('MessageSyncplayNoGroupsAvailable')
        });
    });
}
