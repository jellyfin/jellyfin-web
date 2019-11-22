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

            if (options.panel) {
                if (task) {
                    options.panel.classList.remove('hide');
                } else {
                    options.panel.classList.add('hide');
                }
            }

            if (!task) {
                return;
            }

            if (task.State == 'Idle') {
                button.removeAttribute("disabled");
            } else {
                button.setAttribute("disabled", "disabled");
            }

            button.setAttribute("data-taskid", task.Id);
            var progress = (task.CurrentProgressPercentage || 0).toFixed(1);

            if (options.progressElem) {
                options.progressElem.value = progress;

                if (task.State == 'Running') {
                    options.progressElem.classList.remove('hide');
                } else {
                    options.progressElem.classList.add('hide');
                }
            }

            if (options.lastResultElem) {
                var lastResult = task.LastExecutionResult ? task.LastExecutionResult.Status : '';

                if (lastResult == "Failed") {
                    options.lastResultElem.html('<span style="color:#FF0000;">(' + Globalize.translate('LabelFailed') + ')</span>');
                } else if (lastResult == "Cancelled") {
                    options.lastResultElem.html('<span style="color:#0026FF;">(' + Globalize.translate('LabelCancelled') + ')</span>');
                } else if (lastResult == "Aborted") {
                    options.lastResultElem.html('<span style="color:#FF0000;">' + Globalize.translate('LabelAbortedByServerShutdown') + '</span>');
                } else {
                    options.lastResultElem.html(lastResult);
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

        var pollInterval;
        var button = options.button;
        var serverId = ApiClient.serverId();

        function onPollIntervalFired() {
            if (!connectionManager.getApiClient(serverId).isMessageChannelOpen()) {
                pollTasks();
            }
        }

        function startInterval() {
            var apiClient = connectionManager.getApiClient(serverId);

            if (pollInterval) {
                clearInterval(pollInterval);
            }
            apiClient.sendMessage("ScheduledTasksInfoStart", "1000,1000");
            pollInterval = setInterval(onPollIntervalFired, 5000);
        }

        function stopInterval() {
            connectionManager.getApiClient(serverId).sendMessage("ScheduledTasksInfoStop");

            if (pollInterval) {
                clearInterval(pollInterval);
            }
        }

        if (options.panel) {
            options.panel.classList.add("hide");
        }

        if (options.mode == 'off') {
            button.removeEventListener("click", onButtonClick);
            events.off(serverNotifications, "ScheduledTasksInfo", onScheduledTasksUpdate);
            stopInterval();
        } else {
            button.addEventListener("click", onButtonClick);
            pollTasks();
            startInterval();
            events.on(serverNotifications, "ScheduledTasksInfo", onScheduledTasksUpdate);
        }
    };
});
