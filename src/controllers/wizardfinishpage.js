define(["loading"], function (loading) {
    "use strict";

    function onFinish() {
        loading.show();
        ApiClient.ajax({
            url: ApiClient.getUrl("Startup/Complete"),
            type: "POST"
        }).then(function () {
            loading.hide();
            window.location.href = "index.html";
        });
    }

    return function (view, params) {
        view.querySelector(".btnWizardNext").addEventListener("click", onFinish);
    };
});
