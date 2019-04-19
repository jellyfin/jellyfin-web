define(["apphost", "connectionManager", "listViewStyle", "emby-button"], function(appHost, connectionManager) {
    "use strict";

    return function(view, params) {
        view.querySelector(".btnLogout").addEventListener("click", function() {
            Dashboard.logout();
        });

        view.addEventListener("viewshow", function() {
            var page = this;
            var userId = params.userId || Dashboard.getCurrentUserId();

            page.querySelector(".lnkDisplayPreferences").setAttribute("href", "mypreferencesdisplay.html?userId=" + userId);
            page.querySelector(".lnkLanguagePreferences").setAttribute("href", "mypreferenceslanguages.html?userId=" + userId);
            page.querySelector(".lnkSubtitleSettings").setAttribute("href", "mypreferencessubtitles.html?userId=" + userId);
            page.querySelector(".lnkHomeScreenPreferences").setAttribute("href", "mypreferenceshome.html?userId=" + userId);
            page.querySelector(".lnkMyProfile").setAttribute("href", "myprofile.html?userId=" + userId);

            if (appHost.supports("multiserver")) {
                page.querySelector(".selectServer").classList.remove("hide")
            } else {
                page.querySelector(".selectServer").classList.add("hide");
            }

            connectionManager.user(ApiClient).then(function(user) {
                if (user.localUser && !user.localUser.EnableAutoLogin) {
                    view.querySelector(".btnLogout").classList.remove("hide");
                } else {
                    view.querySelector(".btnLogout").classList.add("hide");
                }
            });

            Dashboard.getCurrentUser().then(function(user) {
                page.querySelector(".headerUser").innerHTML = user.Name;
                if (user.Policy.IsAdministrator) {
                    page.querySelector(".adminSection").classList.remove("hide");
                } else {
                    page.querySelector(".adminSection").classList.add("hide");
                }
            });
        })
    }
});
