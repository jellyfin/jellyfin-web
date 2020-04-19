define(['require', 'apphost', 'layoutManager', 'focusManager', 'globalize', 'loading', 'connectionManager', 'listViewStyle', 'emby-select', 'emby-checkbox'], function (require, appHost, layoutManager, focusManager, globalize, loading, connectionManager) {
    "use strict";

    function authorizeRequest(event) {
        var lookup = event.data.lookup;
        var url = ApiClient.getUrl("/QuickConnect/Authorize");
        ApiClient.ajax({
            type: "POST",
            url: url,
            data: {
                "Lookup": lookup
            }
        }, true);
    }

    QuickConnectSettings.prototype.list = function(argPage) {
        ApiClient.getJSON("/QuickConnect/List").then(json => {
            var elem = $(argPage.querySelector("#quickConnectIncoming"));
            elem.html("");
            for (var i = 0; i < json.length; i++) {
                var current = json[i];
                var html = "<li>" + current.Code + " - " + current.FriendlyName + " - ";

                if (!current.Authenticated) {
                    html += "<a href=\"#\" id=\"qc" + current.Lookup + "\">authorize</a>";
                } else {
                    html += " (already authorized)";
                }

                html += "</li>";
                elem.append(html);
                $("#qc" + current.Lookup).click({ lookup: current.Lookup }, authorizeRequest);
            }

            return true;
        }).catch((e) => {
            console.error("Unable to get quick connect login requests. error:", e);
        });
    };

    QuickConnectSettings.prototype.activate = function() {
        var url = ApiClient.getUrl("/QuickConnect/Activate");
        ApiClient.ajax({
            type: "POST",
            url: url,
            contentType: "application/json",
            dataType: "json"
        }).then((json) => {
            let message = json.Error;

            console.log("message is \"" + message + "\"");
            if (message && message !== "") {
                console.error("Error activating quick connect. Error: ", json.Error);

                Dashboard.alert({
                    title: "Unable to activate quick connect",
                    message: message
                });

                return false;
            }

            Dashboard.alert({
                message: "Successfully activated"
            });

            return true;
        }).catch((e) => {
            console.error("Error activating quick connect. Error:", e);
            throw e;
        });
    };

    function QuickConnectSettings(options) {
        this.options = options;
    }

    QuickConnectSettings.prototype.loadData = function () {
        this.options.interval = setInterval(this.list, 5000, this.options.page);
        this.list(this.options.page);
    };

    QuickConnectSettings.prototype.submit = function () {
        return false;
    };

    QuickConnectSettings.prototype.destroy = function () {
        console.debug("clearing refresh interval", this.options.interval);
        clearInterval(this.options.interval);
        this.options = null;
    };

    QuickConnectSettings.prototype.interval = function (interval) {
        this.options.interval = interval;
    };

    return QuickConnectSettings;
});
