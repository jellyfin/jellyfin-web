import events from 'events';
import connectionManager from 'connectionManager';
import playbackManager from 'playbackManager';
import syncplayManager from 'syncplayManager';
import loading from 'loading';
import datetime from 'datetime';
import toast from 'toast';
import actionsheet from 'actionsheet';
import globalize from 'globalize';

/**
 * Gets active player id.
 * @returns {string} The player's id.
 */
function getActivePlayerId() {
    var info = playbackManager.getPlayerInfo();
    return info ? info.id : null;
}

/**
 * Used to avoid console logs about uncaught promises
 */
function emptyCallback() {
    // avoid console logs about uncaught promises
}

/**
 * Used when user needs to join a group.
 * @param {HTMLElement} button - Element where to place the menu.
 */
function showNewJoinGroupSelection(button) {
    var apiClient = connectionManager.currentApiClient();
    var sessionId = getActivePlayerId();
    sessionId = sessionId ? sessionId : "none";

    loading.show();

    apiClient.sendSyncplayCommand(sessionId, "ListGroups").then(function (response) {
        response.json().then(function (groups) {
            var inSession = sessionId !== "none";

            var menuItems = groups.map(function (group) {
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

            if (inSession) {
                menuItems.push({
                    name: globalize.translate('LabelSyncplayNewGroup'),
                    icon: "add",
                    id: "new-group",
                    selected: true,
                    secondaryText: globalize.translate('LabelSyncplayNewGroupDescription')
                });
            }

            if (menuItems.length === 0) {
                    toast({
                        text: globalize.translate('MessageSyncplayNoGroupsAvailable')
                    });
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
                        GroupId: id
                    });
                }
            }, emptyCallback);

            loading.hide();
        });
    }).catch(function (error) {
        loading.hide();
        console.error(error);
    });
}

/**
 * Used when user has joined a group.
 * @param {HTMLElement} button - Element where to place the menu.
 */
function showLeaveGroupSelection(button) {
    const apiClient = connectionManager.currentApiClient();
    const sessionId = getActivePlayerId();

    loading.show();

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
export function show(button) {
    if (syncplayEnabled) {
        showLeaveGroupSelection(button);
    } else {
        showNewJoinGroupSelection(button);
    }
}
