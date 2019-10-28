define(["dom", "emby-button"], function (dom) {
    "use strict";

    function onSubmit(e) {
        if (dom.parentWithClass(this, "page").querySelector(".chkAccept").checked) {
            Dashboard.navigate("wizardfinish.html");
        } else {
            Dashboard.alert({
                message: Globalize.translate("MessagePleaseAcceptTermsOfServiceBeforeContinuing"),
                title: ""
            });
        }

        e.preventDefault();
        return false;
    }

    return function (view, params) {
        view.querySelector(".wizardAgreementForm").addEventListener("submit", onSubmit);
        view.addEventListener("viewshow", function () {
            document.querySelector(".skinHeader").classList.add("noHomeButtonHeader");
        });
        view.addEventListener("viewhide", function () {
            document.querySelector(".skinHeader").classList.remove("noHomeButtonHeader");
        });
    };
});
