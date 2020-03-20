define(["jQuery", "loading", "datetime", "dom", "globalize", "emby-input", "emby-button", "emby-select"], function ($, loading, datetime, dom, globalize) {
    "use strict";

    function fillTimeOfDay(select) {

        var options = [];

        for (var i = 0; i < 86400000; i += 900000) {
            options.push({
                name: ScheduledTaskPage.getDisplayTime(i * 10000),
                value: i * 10000
            });
        }

        select.innerHTML = options.map(function (o) {
            return '<option value="' + o.value + '">' + o.name + '</option>';
        }).join("");
    }

    Array.prototype.remove = function (from, to) {
        var rest = this.slice((to || from) + 1 || this.length);
        this.length = from < 0 ? this.length + from : from;
        return this.push.apply(this, rest);
    };

    var ScheduledTaskPage = {
        refreshScheduledTask: function (view) {
            loading.show();
            var id = getParameterByName("id");
            ApiClient.getScheduledTask(id).then(function (task) {
                ScheduledTaskPage.loadScheduledTask(view, task);
            });
        },
        loadScheduledTask: function (view, task) {
            $(".taskName", view).html(task.Name);
            $("#pTaskDescription", view).html(task.Description);

            require(["listViewStyle"], function () {
                ScheduledTaskPage.loadTaskTriggers(view, task);
            });

            loading.hide();
        },
        loadTaskTriggers: function (context, task) {
            var html = "";
            html += '<div class="paperList">';

            for (var i = 0, length = task.Triggers.length; i < length; i++) {
                var trigger = task.Triggers[i];

                html += '<div class="listItem listItem-border">';
                html += '<i class="material-icons listItemIcon">schedule</i>';
                if (trigger.MaxRuntimeMs) {
                    html += '<div class="listItemBody two-line">';
                } else {
                    html += '<div class="listItemBody">';
                }
                html += "<div class='listItemBodyText'>" + ScheduledTaskPage.getTriggerFriendlyName(trigger) + "</div>";
                if (trigger.MaxRuntimeMs) {
                    html += '<div class="listItemBodyText secondary">';
                    var hours = trigger.MaxRuntimeTicks / 36e9;
                    if (hours == 1) {
                        html += globalize.translate("ValueTimeLimitSingleHour");
                    } else {
                        html += globalize.translate("ValueTimeLimitMultiHour", hours);
                    }
                    html += "</div>";
                }

                html += "</div>";
                html += '<button class="btnDeleteTrigger" data-index="' + i + '" type="button" is="paper-icon-button-light" title="' + globalize.translate("ButtonDelete") + '"><i class="material-icons">delete</i></button>';
                html += "</div>";
            }

            html += "</div>";
            context.querySelector(".taskTriggers").innerHTML = html;
        },
        getTriggerFriendlyName: function (trigger) {
            if ("DailyTrigger" == trigger.Type) {
                return "Daily at " + ScheduledTaskPage.getDisplayTime(trigger.TimeOfDayTicks);
            }

            if ("WeeklyTrigger" == trigger.Type) {
                return trigger.DayOfWeek + "s at " + ScheduledTaskPage.getDisplayTime(trigger.TimeOfDayTicks);
            }

            if ("SystemEventTrigger" == trigger.Type && "WakeFromSleep" == trigger.SystemEvent) {
                return "On wake from sleep";
            }

            if (trigger.Type == "IntervalTrigger") {

                var hours = trigger.IntervalTicks / 36e9;

                if (hours == 0.25) {
                    return "Every 15 minutes";
                }
                if (hours == 0.5) {
                    return "Every 30 minutes";
                }
                if (hours == 0.75) {
                    return "Every 45 minutes";
                }
                if (hours == 1) {
                    return "Every hour";
                }

                return "Every " + hours + " hours";
            }

            if (trigger.Type == "StartupTrigger") {
                return "On application startup";
            }

            return trigger.Type;
        },
        getDisplayTime: function (ticks) {
            var ms = ticks / 1e4;
            var now = new Date();
            now.setHours(0, 0, 0, 0);
            now.setTime(now.getTime() + ms);
            return datetime.getDisplayTime(now);
        },
        showAddTriggerPopup: function (view) {
            $("#selectTriggerType", view).val("DailyTrigger");
            view.querySelector("#selectTriggerType").dispatchEvent(new CustomEvent("change", {}));
            $("#popupAddTrigger", view).removeClass("hide");
        },
        confirmDeleteTrigger: function (view, index) {
            require(["confirm"], function (confirm) {
                confirm(globalize.translate("MessageDeleteTaskTrigger"), globalize.translate("HeaderDeleteTaskTrigger")).then(function () {
                    ScheduledTaskPage.deleteTrigger(view, index);
                });
            });
        },
        deleteTrigger: function (view, index) {
            loading.show();
            var id = getParameterByName("id");
            ApiClient.getScheduledTask(id).then(function (task) {
                task.Triggers.remove(index);
                ApiClient.updateScheduledTaskTriggers(task.Id, task.Triggers).then(function () {
                    ScheduledTaskPage.refreshScheduledTask(view);
                });
            });
        },
        refreshTriggerFields: function (page, triggerType) {
            if (triggerType == "DailyTrigger") {
                $("#fldTimeOfDay", page).show();
                $("#fldDayOfWeek", page).hide();
                $("#fldSelectSystemEvent", page).hide();
                $("#fldSelectInterval", page).hide();
                $("#selectTimeOfDay", page).attr("required", "required");
            } else if (triggerType == "WeeklyTrigger") {
                $("#fldTimeOfDay", page).show();
                $("#fldDayOfWeek", page).show();
                $("#fldSelectSystemEvent", page).hide();
                $("#fldSelectInterval", page).hide();
                $("#selectTimeOfDay", page).attr("required", "required");
            } else if (triggerType == "SystemEventTrigger") {
                $("#fldTimeOfDay", page).hide();
                $("#fldDayOfWeek", page).hide();
                $("#fldSelectSystemEvent", page).show();
                $("#fldSelectInterval", page).hide();
                $("#selectTimeOfDay", page).removeAttr("required");
            } else if (triggerType == "IntervalTrigger") {
                $("#fldTimeOfDay", page).hide();
                $("#fldDayOfWeek", page).hide();
                $("#fldSelectSystemEvent", page).hide();
                $("#fldSelectInterval", page).show();
                $("#selectTimeOfDay", page).removeAttr("required");
            } else if (triggerType == "StartupTrigger") {
                $("#fldTimeOfDay", page).hide();
                $("#fldDayOfWeek", page).hide();
                $("#fldSelectSystemEvent", page).hide();
                $("#fldSelectInterval", page).hide();
                $("#selectTimeOfDay", page).removeAttr("required");
            }
        },
        getTriggerToAdd: function (page) {
            var trigger = {
                Type: $("#selectTriggerType", page).val()
            };

            if (trigger.Type == "DailyTrigger") {
                trigger.TimeOfDayTicks = $("#selectTimeOfDay", page).val();
            } else if (trigger.Type == "WeeklyTrigger") {
                trigger.DayOfWeek = $("#selectDayOfWeek", page).val();
                trigger.TimeOfDayTicks = $("#selectTimeOfDay", page).val();
            } else if (trigger.Type == "SystemEventTrigger") {
                trigger.SystemEvent = $("#selectSystemEvent", page).val();
            } else if (trigger.Type == "IntervalTrigger") {
                trigger.IntervalTicks = $("#selectInterval", page).val();
            }

            var timeLimit = $("#txtTimeLimit", page).val() || "0";
            timeLimit = parseFloat(timeLimit) * 3600000;

            trigger.MaxRuntimeMs = timeLimit || null;

            return trigger;
        }
    };
    return function (view, params) {
        function onSubmit(e) {
            loading.show();
            var id = getParameterByName("id");
            ApiClient.getScheduledTask(id).then(function (task) {
                task.Triggers.push(ScheduledTaskPage.getTriggerToAdd(view));
                ApiClient.updateScheduledTaskTriggers(task.Id, task.Triggers).then(function () {
                    $("#popupAddTrigger").addClass("hide");
                    ScheduledTaskPage.refreshScheduledTask(view);
                });
            });
            e.preventDefault();
        }

        view.querySelector(".addTriggerForm").addEventListener("submit", onSubmit);
        fillTimeOfDay(view.querySelector("#selectTimeOfDay"));
        $(view.querySelector("#popupAddTrigger").parentNode).trigger("create");
        view.querySelector(".selectTriggerType").addEventListener("change", function () {
            ScheduledTaskPage.refreshTriggerFields(view, this.value);
        });
        view.querySelector(".btnAddTrigger").addEventListener("click", function () {
            ScheduledTaskPage.showAddTriggerPopup(view);
        });
        view.addEventListener("click", function (e) {
            var btnDeleteTrigger = dom.parentWithClass(e.target, "btnDeleteTrigger");

            if (btnDeleteTrigger) {
                ScheduledTaskPage.confirmDeleteTrigger(view, parseInt(btnDeleteTrigger.getAttribute("data-index")));
            }
        });
        view.addEventListener("viewshow", function () {
            ScheduledTaskPage.refreshScheduledTask(view);
        });
    };
});
