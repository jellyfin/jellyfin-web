import events from 'events';
import connectionManager from 'connectionManager';
import playbackManager from 'playbackManager';
import syncplayManager from 'syncplayManager';
import loading from 'loading';
import datetime from 'datetime';
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
 * Used to avoid console logs about uncaught promises
 */
function emptyCallback () {
    // avoid console logs about uncaught promises
}

/**
 * Used when user needs to join a group.
 * @param {HTMLElement} button - Element where to place the menu.
 * @param {Object} user - Current user.
 * @param {Object} apiClient - ApiClient.
 */
function showNewJoinGroupSelection (button, user, apiClient) {
    let sessionId = getActivePlayerId();
    sessionId = sessionId ? sessionId : "none";
    const inSession = sessionId !== "none";
    const policy = user.localUser ? user.localUser.Policy : {};
    let playingItemId;
    try {
        const playState = playbackManager.getPlayerState();
        playingItemId = playState.NowPlayingItem.Id;
    } catch (error) {
        playingItemId = "";
    }

    apiClient.sendSyncplayCommand(sessionId, "ListGroups").then(function (response) {
        response.json().then(function (groups) {            
            var menuItems = groups.map(function (group) {
                // TODO: update running time if group is playing?
                var name = datetime.getDisplayRunningTime(group.PositionTicks);
                if (!inSession) {
                    name = group.PlayingItemName;
                }
                return {
                    name: name,
                    icon: "group",
                    id: group.GroupId,
                    selected: false,
                    secondaryText: group.Partecipants.join(", ")
                };
            });

            if (inSession && policy.SyncplayAccess === "CreateAndJoinGroups") {
                menuItems.push({
                    name: globalize.translate('LabelSyncplayNewGroup'),
                    icon: "add",
                    id: "new-group",
                    selected: true,
                    secondaryText: globalize.translate('LabelSyncplayNewGroupDescription')
                });
            }

            if (menuItems.length === 0) {
                if (inSession && policy.SyncplayAccess === "JoinGroups") {
                    toast({
                        text: globalize.translate('MessageSyncplayPermissionRequired')
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
                if (id == "new-group") {
                    apiClient.sendSyncplayCommand(sessionId, "NewGroup");
                } else {
                    apiClient.sendSyncplayCommand(sessionId, "JoinGroup", {
                        GroupId: id,
                        PlayingItemId: playingItemId
                    });
                }
            }, emptyCallback);

            loading.hide();
        });
    }).catch(function (error) {
        console.error(error);
        loading.hide();
        toast({
            text: globalize.translate('MessageSyncplayNoGroupsAvailable')
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
            // TODO: translate
            text: "Syncplay error occured."
        });
        return;
    }


    const menuItems = [{
        name: globalize.translate('LabelSyncplayLeaveGroup'),
        icon: "meeting_room",
        id: "leave-group",
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
        if (id == "leave-group") {
            apiClient.sendSyncplayCommand(sessionId, "LeaveGroup");
        }
    }, emptyCallback);

    loading.hide();
}

// Register to Syncplay events
let syncplayEnabled = false;
events.on(syncplayManager, 'SyncplayEnabled', function (e, enabled) {
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
        console.debug("Playback is allowed.");
    }).catch((error) => {
        console.error("Playback not allowed!", error);
        toast({
            text: globalize.translate("MessageSyncplayPlaybackPermissionRequired")
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
