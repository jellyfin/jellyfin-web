define(["loading", "globalize", "dashboardcss", "emby-input", "emby-button", "emby-button"], function(loading, globalize) {
    "use strict";

    function getApiClient() {
        return ApiClient;
    }

    function nextWizardPage() {
        Dashboard.navigate("wizardlibrary.html");
    }

    function onUpdateUserComplete(result) {
        console.log(result);
        loading.hide();
        nextWizardPage();
    }

    function submit(form) {
        loading.show();
        var apiClient = getApiClient();
        apiClient.ajax({
            type: "POST",
            data: {
                Name: form.querySelector("#txtUsername").value,
                Password: form.querySelector("#txtManualPassword").value
            },
            url: apiClient.getUrl("Startup/User")
        }).then(onUpdateUserComplete);
    }

    function onSubmit(e) {
        var form = this;
        if (form.querySelector("#txtManualPassword").value != form.querySelector("#txtPasswordConfirm").value) {
            require(["toast"], function(toast) {
                toast(Globalize.translate("PasswordMatchError"));
            });
        } else {
            submit(form);
        }
        e.preventDefault();
        return false;
    }

    function onViewShow() {
        loading.show();
        var page = this;
        var apiClient = getApiClient();
        apiClient.getJSON(apiClient.getUrl("Startup/User")).then(function(user) {
            page.querySelector("#txtUsername").value = user.Name || "";
            page.querySelector("#txtManualPassword").value = user.Password || "";
            loading.hide();
        })
    }
    return function(view, params) {
        view.querySelector(".wizardUserForm").addEventListener("submit", onSubmit);
        view.addEventListener("viewshow", function() {
            document.querySelector(".skinHeader").classList.add("noHomeButtonHeader")
        });
        view.addEventListener("viewhide", function() {
            document.querySelector(".skinHeader").classList.remove("noHomeButtonHeader")
        });
        view.addEventListener("viewshow", onViewShow);
    }
});
