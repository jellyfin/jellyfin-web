define(["components/activitylog", "globalize"], function (ActivityLog, globalize) {
    "use strict";

    return function (view, params) {
        var activityLog;

        if (params.useractivity !== "false") {
            view.querySelector(".activityItems").setAttribute("data-useractivity", "true");
            view.querySelector(".sectionTitle").innerHTML = globalize.translate("HeaderActivity");
        } else {
            view.querySelector(".activityItems").setAttribute("data-useractivity", "false");
            view.querySelector(".sectionTitle").innerHTML = globalize.translate("Alerts");
        }

        view.addEventListener("viewshow", function () {
            if (!activityLog) {
                activityLog = new ActivityLog({
                    serverId: ApiClient.serverId(),
                    element: view.querySelector(".activityItems")
                });
            }
        });
        view.addEventListener("viewdestroy", function () {
            if (activityLog) {
                activityLog.destroy();
            }

            activityLog = null;
        });
    };
});
