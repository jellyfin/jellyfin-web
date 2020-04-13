define(['require', 'apphost', 'layoutManager', 'focusManager', 'globalize', 'loading', 'connectionManager', 'homeSections', 'dom', 'events', 'listViewStyle', 'emby-select', 'emby-checkbox'], function (require, appHost, layoutManager, focusManager, globalize, loading, connectionManager, homeSections, dom, events) {
    "use strict";

    function authorizeRequest(event) {
        var lookup = event.data.lookup;
        var apiClient = event.data.apiClient;
        var url = ApiClient.getUrl("/QuickConnect/Authorize");
        apiClient.ajax({
            type: "POST",
            url: url,
            data: {
                "Lookup": lookup
            }
        }, true);
    }
    
    function list(apiClient) {
        console.debug("getting json");
        apiClient.getJSON("/QuickConnect/List").then(json => {
            var elem = $("#quickConnectIncoming");
            elem.html("");
            console.debug("raw json", json, "length is", json.length);
            for(var i = 0; i < json.length; i++) {
                var current = json[i];
                console.debug("current is", current);
                var html = "<li>" + current.Code + " - " + current.FriendlyName + " - ";
                
                if(!current.Authenticated) {
                    html += "<a href=\"#\" id=\"qc" + current.Lookup + "\">authorize</a>";
                }
                else {
                    html += " (already authorized)";
                }
                
                html += "</li>";
                elem.append(html);
                $("#qc" + current.Lookup).click({ lookup: current.Lookup, apiClient: apiClient}, authorizeRequest);
            }
        });
    }

    function QuickConnectSettings(options) {
        this.options = options;
    }

    QuickConnectSettings.prototype.loadData = function () {
        loading.show();

        var apiClient = connectionManager.getApiClient(this.options.serverId);
        
        list(apiClient);
        
        console.debug("request list finished");
        
        loading.hide();
    };

    QuickConnectSettings.prototype.submit = function () {
        return false;
    };

    QuickConnectSettings.prototype.destroy = function () {
        this.options = null;
    };

    return QuickConnectSettings;
});
