define(["apphost", "appSettings", "dom", "connectionManager", "loading", "cardStyle", "emby-checkbox"], function(appHost, appSettings, dom, connectionManager, loading) {
    "use strict";

    function authenticateUserByName(page, apiClient, username, password) {
        loading.show();
        apiClient.authenticateUserByName(username, password).then(function(result) {
            var user = result.User;
            var serverId = getParameterByName("serverid");
            var newUrl = user.Policy.IsAdministrator && !serverId ? "dashboard.html" : "home.html";
            loading.hide();
            Dashboard.onServerChanged(user.Id, result.AccessToken, apiClient);
            Dashboard.navigate(newUrl);
        }, function(response) {
            page.querySelector("#txtManualName").value = "";
            page.querySelector("#txtManualPassword").value = "";
            loading.hide();
            if (response.status === 401) {
                require(["toast"], function(toast) {
                    toast(Globalize.translate("MessageInvalidUser"));
                });
            } else {
                Dashboard.alert({
                    message: Globalize.translate("MessageUnableToConnectToServer"),
                    title: Globalize.translate("HeaderConnectionFailure")
                });
            }
        });
    }

    function showManualForm(context, showCancel, focusPassword) {
        context.querySelector(".chkRememberLogin").checked = appSettings.enableAutoLogin();
        context.querySelector(".manualLoginForm").classList.remove("hide");
        context.querySelector(".visualLoginForm").classList.add("hide");
        context.querySelector(".btnManual").classList.add("hide");
        focusPassword ? context.querySelector("#txtManualPassword").focus() : context.querySelector("#txtManualName").focus();
        showCancel ? context.querySelector(".btnCancel").classList.remove("hide") : context.querySelector(".btnCancel").classList.add("hide");
    }

    var metroColors = ["#6FBD45", "#4BB3DD", "#4164A5", "#E12026", "#800080", "#E1B222", "#008040", "#0094FF", "#FF00C7", "#FF870F", "#7F0037"];

    function getRandomMetroColor() {
        var index = Math.floor(Math.random() * (metroColors.length - 1));
        return metroColors[index];
    }

    function getMetroColor(str) {
        if (str) {
            var character = String(str.substr(0, 1).charCodeAt());
            var sum = 0;
            for (var i = 0; i < character.length; i++) {
                sum += parseInt(character.charAt(i));
            }
            var index = String(sum).substr(-1);
            return metroColors[index];
        }
        return getRandomMetroColor();
    }

    function loadUserList(context, apiClient, users) {
        var html = "";
        for (var i = 0; i < users.length; i++) {
            var user = users[i];
            html += '<button type="button" class="card squareCard scalableCard squareCard-scalable"><div class="cardBox cardBox-bottompadded">';
            html += '<div class="cardScalable">';
            html += '<div class="cardPadder cardPadder-square"></div>';
            html += '<div class="cardContent" data-haspw="' + user.HasPassword + '" data-username="' + user.Name + '" data-userid="' + user.Id + '">';
            var imgUrl;
            if (user.PrimaryImageTag) {
                imgUrl = apiClient.getUserImageUrl(user.Id, {
                    width: 300,
                    tag: user.PrimaryImageTag,
                    type: "Primary"
                });
                html += '<div class="cardImageContainer coveredImage coveredImage-noScale" style="background-image:url(\'' + imgUrl + "');\"></div>";
            } else {
                var background = getMetroColor(user.Id);
                imgUrl = "img/logindefault.png";
                html += '<div class="cardImageContainer coveredImage coveredImage-noScale" style="background-image:url(\'' + imgUrl + "');background-color:" + background + ';"></div>';
            }
            html += "</div>";
            html += "</div>";
            html += '<div class="cardFooter visualCardBox-cardFooter">';
            html += '<div class="cardText singleCardText cardTextCentered">' + user.Name + "</div>";
            html += "</div>";
            html += "</div>";
            html += "</button>";
        }
        context.querySelector("#divUsers").innerHTML = html;
    }

    return function(view, params) {
        function getApiClient() {
            var serverId = params.serverid;
            return serverId ? connectionManager.getOrCreateApiClient(serverId) : ApiClient;
        }

        function showVisualForm() {
            view.querySelector(".visualLoginForm").classList.remove("hide");
            view.querySelector(".manualLoginForm").classList.add("hide");
            view.querySelector(".btnManual").classList.remove("hide");
        }

        view.querySelector("#divUsers").addEventListener("click", function(e) {
            var card = dom.parentWithClass(e.target, "card");
            var cardContent = card ? card.querySelector(".cardContent") : null;
            if (cardContent) {
                var context = view;
                var id = cardContent.getAttribute("data-userid");
                var name = cardContent.getAttribute("data-username");
                var haspw = cardContent.getAttribute("data-haspw");
                if (id === 'manual') {
                    context.querySelector("#txtManualName").value = "";
                    showManualForm(context, true);
                } else if (haspw == 'false') {
                    authenticateUserByName(context, getApiClient(), name, "");
                } else {
                    context.querySelector("#txtManualName").value = name;
                    context.querySelector("#txtManualPassword").value = "";
                    showManualForm(context, true, true);
                }
            }
        });

        view.querySelector(".manualLoginForm").addEventListener("submit", function(e) {
            appSettings.enableAutoLogin(view.querySelector(".chkRememberLogin").checked);
            var apiClient = getApiClient();
            authenticateUserByName(view, apiClient, view.querySelector("#txtManualName").value, view.querySelector("#txtManualPassword").value);
            e.preventDefault();
            return false;
        });

        view.querySelector(".btnForgotPassword").addEventListener("click", function() {
            Dashboard.navigate("forgotpassword.html");
        });

        view.querySelector(".btnCancel").addEventListener("click", showVisualForm);

        view.querySelector(".btnManual").addEventListener("click", function() {
            view.querySelector("#txtManualName").value = "";
            showManualForm(view, true);
        });

        view.addEventListener("viewshow", function(e) {
            loading.show();
            if (!appHost.supports('multiserver')) {
                view.querySelector(".btnSelectServer").classList.add("hide");
            }
            var apiClient = getApiClient();
            apiClient.getPublicUsers().then(function(users) {
                if (users.length) {
                    showVisualForm();
                    loadUserList(view, apiClient, users);
                } else {
                    view.querySelector("#txtManualName").value = "";
                    showManualForm(view, false, false);
                }
            }).catch().then(function() {
                loading.hide();
            });

            apiClient.getJSON(apiClient.getUrl("Branding/Configuration")).then(function(options) {
                view.querySelector(".disclaimer").textContent = options.LoginDisclaimer || "";
            });
        });
    }
});
