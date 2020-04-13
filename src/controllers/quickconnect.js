define(["jQuery", "loading", "libraryMenu", "fnchecked"], function ($, loading, libraryMenu) {
    "use strict";

    function loadPage(page, status) {
        console.debug("status is \"" + status + "\"");

        var active = (status == "Active");
        var available = (status == "Available") || active;

        page.querySelector("#quickConnectStatus").textContent = status.toLocaleLowerCase();
        page.querySelector("#chkQuickConnectAvailable").checked = available;
        page.querySelector("#chkQuickConnectActive").checked = active;

        loading.hide();
    }

    function onSubmit() {
        loading.show();
        
        var available = $("#chkQuickConnectAvailable").is(":checked") ? "Available" : "Unavailable";
        var url = ApiClient.getUrl("/QuickConnect/Available");
        
        ApiClient.ajax({
            type: "POST",
            data: {
                "Status": available
            },
            url: url
        }, true).then(() => {
            if($("#chkQuickConnectActive").is(":checked")) {
                url = ApiClient.getUrl("/QuickConnect/Activate");
                ApiClient.ajax({
                    type: "POST",
                    url: url
                }, true);
            }
            
            Dashboard.alert({
                message: "Settings saved",
                title: "Saved"
            });
        });
        
        loading.hide();
        return false;
    }

    $(document).on("pageinit", "#quickConnectPage", function () {
        document.querySelector("#quickConnectPage").onsubmit = onSubmit;
        document.querySelector("#btnQuickConnectSubmit").onclick = onSubmit;
    }).on("pageshow", "#quickConnectPage", function () {
        loading.show();
        var page = this;
        var promise1 = ApiClient.getQuickConnect("Status");
        Promise.all([promise1]).then(function (responses) {
            loadPage(page, responses[0]);
        });
    });
});
