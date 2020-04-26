define(["jQuery", "loading", "fnchecked"], function ($, loading) {
    "use strict";

    let page;
    function loadPage(status) {
        let available = status === "Available" || status === "Active";

        page.querySelector("#quickConnectStatus").textContent = status.toLocaleLowerCase();
        page.querySelector("#chkQuickConnectAvailable").checked = available;

        loading.hide();
    }

    function onSubmit() {
        loading.show();

        let newStatus = page.querySelector("#chkQuickConnectAvailable").checked ? "Available" : "Unavailable";

        let url = ApiClient.getUrl("/QuickConnect/Available");

        ApiClient.ajax({
            type: "POST",
            data: {
                "Status": newStatus
            },
            url: url
        }, true).then(() => {
            require(["toast"], function (toast) {
                toast("Settings saved");
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
        let promise1 = ApiClient.getQuickConnect("Status");
        Promise.all([promise1]).then((responses) => {
            loadPage(responses[0]);
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
