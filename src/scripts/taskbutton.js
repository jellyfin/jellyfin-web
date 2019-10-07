define(["events", "userSettings", "serverNotifications", "connectionManager", "emby-button"], function (events, userSettings, serverNotifications, connectionManager) {
    "use strict";

    return function (options) {
        function pollTasks() {
            connectionManager.getApiClient(serverId).getScheduledTasks({
                IsEnabled: true
            }).then(updateTasks);
        }

        function updateTasks(tasks) {
            var task = tasks.filter(function (t) {
                return t.Key == options.taskKey;
            })[0];

            if (options.panel && (task ? options.panel.classList.remove("hide") : options.panel.classList.add("hide")), task) {
                if ("Idle" == task.State) {
                    button.removeAttribute("disabled");
                } else {
                    button.setAttribute("disabled", "disabled");
                }

                button.setAttribute("data-taskid", task.Id);
                var progress = (task.CurrentProgressPercentage || 0).toFixed(1);

                if (options.progressElem && (options.progressElem.value = progress, "Running" == task.State ? options.progressElem.classList.remove("hide") : options.progressElem.classList.add("hide")), options.lastResultElem) {
                    var lastResult = task.LastExecutionResult ? task.LastExecutionResult.Status : "";

                    if ("Failed" == lastResult) {
                        options.lastResultElem.html('<span style="color:#FF0000;">(' + Globalize.translate("LabelFailed") + ")</span>");
                    } else {
                        if ("Cancelled" == lastResult) {
                            options.lastResultElem.html('<span style="color:#0026FF;">(' + Globalize.translate("LabelCancelled") + ")</span>");
                        } else {
                            if ("Aborted" == lastResult) {
                                options.lastResultElem.html('<span style="color:#FF0000;">' + Globalize.translate("LabelAbortedByServerShutdown") + "</span>");
                            } else {
                                options.lastResultElem.html(lastResult);
                            }
                        }
                    }
                }
            }
        }

        function onScheduledTaskMessageConfirmed(id) {
            connectionManager.getApiClient(serverId).startScheduledTask(id).then(pollTasks);
        }

        function onButtonClick() {
            onScheduledTaskMessageConfirmed(this.getAttribute("data-taskid"));
        }

        function onScheduledTasksUpdate(e, apiClient, info) {
            if (apiClient.serverId() === serverId) {
                updateTasks(info);
            }
        }

        function onPollIntervalFired() {
            if (!connectionManager.getApiClient(serverId).isMessageChannelOpen()) {
                pollTasks();
            }
        }

        var pollInterval;
        var button = options.button;
        var serverId = ApiClient.serverId();

        if (options.panel) {
            options.panel.classList.add("hide");
        }

        if ("off" == options.mode) {
            button.removeEventListener("click", onButtonClick);
            events.off(serverNotifications, "ScheduledTasksInfo", onScheduledTasksUpdate);

            (function () {
                connectionManager.getApiClient(serverId).sendMessage("ScheduledTasksInfoStop");

                if (pollInterval) {
                    clearInterval(pollInterval);
                }
            })();
        } else {
            button.addEventListener("click", onButtonClick);
            pollTasks();

            (function () {
                var apiClient = connectionManager.getApiClient(serverId);

                if (pollInterval) {
                    clearInterval(pollInterval);
                }

                apiClient.sendMessage("ScheduledTasksInfoStart", "1000,1000");
                pollInterval = setInterval(onPollIntervalFired, 1e4);
            })();

            events.on(serverNotifications, "ScheduledTasksInfo", onScheduledTasksUpdate);
        }
    };
});
