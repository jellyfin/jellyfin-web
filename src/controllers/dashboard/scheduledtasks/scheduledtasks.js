define(["jQuery", "loading", "events", "globalize", "serverNotifications", "humanedate", "listViewStyle", "emby-button"], function($, loading, events, globalize, serverNotifications) {
    "use strict";

    function reloadList(page) {
        ApiClient.getScheduledTasks({
            isHidden: false
        }).then(function(tasks) {
            populateList(page, tasks);
            loading.hide();
        })
    }

    function populateList(page, tasks) {
        tasks = tasks.sort(function(a, b) {
            a = a.Category + " " + a.Name;
            b = b.Category + " " + b.Name;
            return a == b ? 0 : a < b ? -1 : 1;
        });

        var currentCategory;
        var html = "";
        for (var i = 0; i < tasks.length; i++) {
            var task = tasks[i];
            if (task.Category != currentCategory) {
                currentCategory = task.Category;
                if (currentCategory) {
                    html += "</div>";
                    html += "</div>";
                }
                html += '<div class="verticalSection verticalSection-extrabottompadding">';
                html += '<div class="sectionTitleContainer" style="margin-bottom:1em;">';
                html += '<h2 class="sectionTitle">';
                html += currentCategory;
                html += "</h2>";
                if (i === 0) {
                    html += '<a is="emby-linkbutton" class="raised button-alt headerHelpButton" target="_blank" href="https://docs.jellyfin.org/general/server/tasks.html">' + globalize.translate("Help") + "</a>";
                }
                html += "</div>";
                html += '<div class="paperList">';
            }
            html += '<div class="listItem listItem-border scheduledTaskPaperIconItem" data-status="' + task.State + '">';
            html += "<a is='emby-linkbutton' style='margin:0;padding:0;' class='clearLink listItemIconContainer' href='scheduledtask.html?id=" + task.Id + "'>";
            html += '<i class="material-icons listItemIcon">schedule</i>';
            html += "</a>";
            html += '<div class="listItemBody two-line">';
            html += "<a class='clearLink' style='margin:0;padding:0;display:block;text-align:left;' is='emby-linkbutton' href='scheduledtask.html?id=" + task.Id + "'>";
            html += "<h3 class='listItemBodyText'>" + task.Name + "</h3>";
            html += "<div class='secondary listItemBodyText' id='taskProgress" + task.Id + "'>" + getTaskProgressHtml(task) + "</div>";
            html += "</a>";
            html += "</div>";
            if (task.State === "Running") {
                html += '<button type="button" is="paper-icon-button-light" id="btnTask' + task.Id + '" class="btnStopTask" data-taskid="' + task.Id + '" title="' + globalize.translate("ButtonStop") + '"><i class="material-icons stop"></i></button>';
            } else if (task.State === "Idle") {
                html += '<button type="button" is="paper-icon-button-light" id="btnTask' + task.Id + '" class="btnStartTask" data-taskid="' + task.Id + '" title="' + globalize.translate("ButtonStart") + '"><i class="material-icons play_arrow"></i></button>';
            }
            html += "</div>";
        }
        if (tasks.length) {
            html += "</div>";
            html += "</div>";
        }
        page.querySelector(".divScheduledTasks").innerHTML = html;
    }

    function getTaskProgressHtml(task) {
        var html = "";
        if (task.State === "Idle") {
            if (task.LastExecutionResult) {
                html += globalize.translate("LabelScheduledTaskLastRan").replace("{0}", humaneDate(task.LastExecutionResult.EndTimeUtc)).replace("{1}", humaneElapsed(task.LastExecutionResult.StartTimeUtc, task.LastExecutionResult.EndTimeUtc));
                if (task.LastExecutionResult.Status === "Failed") {
                    html += " <span style='color:#FF0000;'>(" + globalize.translate("LabelFailed") + ")</span>";
                } else if (task.LastExecutionResult.Status === "Cancelled") {
                    html += " <span style='color:#0026FF;'>(" + globalize.translate("LabelCancelled") + ")</span>";
                } else if (task.LastExecutionResult.Status === "Aborted") {
                    html += " <span style='color:#FF0000;'>" + globalize.translate("LabelAbortedByServerShutdown") + "</span>";
                }
            }
        } else if (task.State === "Running") {
            var progress = (task.CurrentProgressPercentage || 0).toFixed(1);
            html += '<div style="display:flex;align-items:center;">';
            html += '<div class="taskProgressOuter" title="' + progress + '%" style="flex-grow:1;">';
            html += '<div class="taskProgressInner" style="width:' + progress + '%;">';
            html += "</div>";
            html += "</div>";
            html += "<span style='color:#00a4dc;margin-left:5px;'>" + progress + "%</span>";
            html += "</div>";
        } else {
            html += "<span style='color:#FF0000;'>" + globalize.translate("LabelStopping") + "</span>";
        }
        return html;
    }

    function setTaskButtonIcon(button, icon) {
        var inner = button.querySelector("i");
        inner.classList.remove("stop", "play_arrow");
        inner.classList.add(icon);
    }

    function updateTaskButton(elem, state) {
        if (state === "Running") {
            elem.classList.remove("btnStartTask");
            elem.classList.add("btnStopTask");
            setTaskButtonIcon(elem, "stop");
            elem.title = globalize.translate("ButtonStop");
        } else if (state === "Idle") {
            elem.classList.add("btnStartTask");
            elem.classList.remove("btnStopTask");
            setTaskButtonIcon(elem, "play_arrow");
            elem.title = globalize.translate("ButtonStart");
        }
        $(elem).parents(".listItem")[0].setAttribute("data-status", state);
    }

    return function(view, params) {
        function updateTasks(tasks) {
            for (var i = 0; i < tasks.length; i++) {
                var task = tasks[i];
                view.querySelector("#taskProgress" + task.Id).innerHTML = getTaskProgressHtml(task);
                updateTaskButton(view.querySelector("#btnTask" + task.Id), task.State);
            }
        }

        function onPollIntervalFired() {
            if (!ApiClient.isMessageChannelOpen()) {
                reloadList(view);
            }
        }

        function onScheduledTasksUpdate(e, apiClient, info) {
            if (apiClient.serverId() === serverId) {
                updateTasks(info);
            }
        }

        function startInterval() {
            ApiClient.sendMessage("ScheduledTasksInfoStart", "1000,1000");
            pollInterval && clearInterval(pollInterval);
            pollInterval = setInterval(onPollIntervalFired, 1e4);
        }

        function stopInterval() {
            ApiClient.sendMessage("ScheduledTasksInfoStop");
            pollInterval && clearInterval(pollInterval);
        }

        var pollInterval;
        var serverId = ApiClient.serverId();

        $(".divScheduledTasks", view).on("click", ".btnStartTask", function() {
            var button = this;
            var id = button.getAttribute("data-taskid");
            ApiClient.startScheduledTask(id).then(function() {
                updateTaskButton(button, "Running");
                reloadList(view);
            })
        });

        $(".divScheduledTasks", view).on("click", ".btnStopTask", function() {
            var button = this;
            var id = button.getAttribute("data-taskid");
            ApiClient.stopScheduledTask(id).then(function() {
                updateTaskButton(button, "");
                reloadList(view);
            })
        });

        view.addEventListener("viewbeforehide", function() {
            events.off(serverNotifications, "ScheduledTasksInfo", onScheduledTasksUpdate);
            stopInterval();
        });

        view.addEventListener("viewshow", function() {
            loading.show();
            startInterval();
            reloadList(view);
            events.on(serverNotifications, "ScheduledTasksInfo", onScheduledTasksUpdate);
        });
    }
});
