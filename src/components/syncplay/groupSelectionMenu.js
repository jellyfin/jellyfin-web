define(['events', 'loading', 'connectionManager', 'playbackManager', 'syncplayManager', 'globalize', 'datetime'], function (events, loading, connectionManager, playbackManager, syncplayManager, globalize, datetime) {
    'use strict';

    function getActivePlayerId() {
        var info = playbackManager.getPlayerInfo();
        return info ? info.id : null;
    }

    function emptyCallback() {
        // avoid console logs about uncaught promises
    }

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
                    require(['toast'], function (alert) {
                        alert({
                            title: globalize.translate('MessageSyncplayNoGroupsAvailable'),
                            text: globalize.translate('MessageSyncplayNoGroupsAvailable')
                        });
                    });
                    loading.hide();
                    return;
                }

                require(['actionsheet'], function (actionsheet) {

                    loading.hide();

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
                });
            });
        }).catch(function (error) {
            loading.hide();
            console.error(error);
        });
    }

    function showLeaveGroupSelection(button) {
        var apiClient = connectionManager.currentApiClient();
        var sessionId = getActivePlayerId();

        loading.show();

        var menuItems = [{
            name: globalize.translate('LabelSyncplayLeaveGroup'),
            icon: "meeting_room",
            id: "leave-group",
            selected: true,
            secondaryText: globalize.translate('LabelSyncplayLeaveGroupDescription')
        }];

        require(['actionsheet'], function (actionsheet) {

            loading.hide();

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
        });
    }

    function showGroupSelection(button) {
        if (syncplayEnabled) {
            showLeaveGroupSelection(button);
        } else {
            showNewJoinGroupSelection(button);
        }
    }

    var syncplayEnabled = false;

    events.on(syncplayManager, 'SyncplayEnabled', function (e, enabled) {
        syncplayEnabled = enabled;
    });

    return {
        show: showGroupSelection
    };
});
