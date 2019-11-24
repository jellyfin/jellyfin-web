define([], function () {
    "use strict";

    function processForgotPasswordResult(result) {
        if ("ContactAdmin" == result.Action) {
            return void Dashboard.alert({
                message: Globalize.translate("MessageContactAdminToResetPassword"),
                title: Globalize.translate("HeaderForgotPassword")
            });
        }

        if ("InNetworkRequired" == result.Action) {
            return void Dashboard.alert({
                message: Globalize.translate("MessageForgotPasswordInNetworkRequired"),
                title: Globalize.translate("HeaderForgotPassword")
            });
        }

        if ("PinCode" == result.Action) {
            var msg = Globalize.translate("MessageForgotPasswordFileCreated");
            msg += "<br/>";
            msg += "<br/>";
            msg += "Enter PIN here to finish Password Reset<br/>";
            msg += "<br/>";
            msg += result.PinFile;
            msg += "<br/>";
            return void Dashboard.alert({
                message: msg,
                title: Globalize.translate("HeaderForgotPassword"),
                callback: function () {
                    Dashboard.navigate("forgotpasswordpin.html");
                }
            });
        }
    }

    return function (view, params) {
        function onSubmit(e) {
            ApiClient.ajax({
                type: "POST",
                url: ApiClient.getUrl("Users/ForgotPassword"),
                dataType: "json",
                data: {
                    EnteredUsername: view.querySelector("#txtName").value
                }
            }).then(processForgotPasswordResult);
            e.preventDefault();
            return false;
        }

        view.querySelector("form").addEventListener("submit", onSubmit);
    };
});
