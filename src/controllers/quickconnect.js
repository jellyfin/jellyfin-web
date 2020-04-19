define(["jQuery", "loading", "fnchecked"], function ($, loading) {
    "use strict";

    var page;
    function loadPage(page, status) {
        var active = (status == "Active");
        var available = (status == "Available") || active;

        page.querySelector("#quickConnectStatus").textContent = status.toLocaleLowerCase();
        page.querySelector("#chkQuickConnectAvailable").checked = available;
        page.querySelector("#chkQuickConnectActive").checked = active;

        loading.hide();
    }

    function onSubmit() {
        loading.show();

        var newStatus = page.querySelector("#chkQuickConnectAvailable").checked ? "Available" : "Unavailable";
        if (newStatus && page.querySelector("#chkQuickConnectActive").checked) {
            newStatus = "Active";
        }

        var url = ApiClient.getUrl("/QuickConnect/Available");

        ApiClient.ajax({
            type: "POST",
            data: {
                "Status": newStatus
            },
            url: url
        }, true).then(() => {
            Dashboard.alert({
                message: "Settings saved",
                title: "Saved"
            });

            setTimeout(updatePage, 500);

            return true;
        }).catch((e) => {
            console.error("Unable to set quick connect status. error:", e);
        });

        loading.hide();
        return false;
    }

    function updatePage() {
        var promise1 = ApiClient.getQuickConnect("Status");
        Promise.all([promise1]).then((responses) => {
            loadPage(page, responses[0]);
            return true;
        }).catch((e) => {
            console.error("Unable to get quick connect status. error:", e);
        });
    }

    $(document).on("pageshow", "#quickConnectPage", function () {
        loading.show();
        page = this;

        page.querySelector("#btnQuickConnectSubmit").onclick = onSubmit;

        updatePage();
    });
});
