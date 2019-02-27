define(["loading", "libraryMenu", "globalize", "listViewStyle", "emby-button"], function(loading, libraryMenu, globalize) {
    "use strict";

    function reload(page) {
        loading.show();
        ApiClient.getJSON(ApiClient.getUrl("Notifications/Types")).then(function(list) {
            var html = "";
            var lastCategory = "";
            var showHelp = true;
            html += list.map(function(notification) {
                var itemHtml = "";
                if (notification.Category !== lastCategory) {
                    lastCategory = notification.Category;
                    if (lastCategory) {
                        itemHtml += "</div>";
                        itemHtml += "</div>";
                    }
                    itemHtml += '<div class="verticalSection verticalSection-extrabottompadding">';
                    itemHtml += '<div class="sectionTitleContainer" style="margin-bottom:1em;">';
                    itemHtml += '<h2 class="sectionTitle">';
                    itemHtml += notification.Category;
                    itemHtml += "</h2>";
                    if (showHelp) {
                        showHelp = false;
                        itemHtml += '<a is="emby-linkbutton" class="raised button-alt headerHelpButton" target="_blank" href="https://web.archive.org/web/20181216120305/https://github.com/MediaBrowser/Wiki/wiki/Notifications">';
                        itemHtml += globalize.translate("Help");
                        itemHtml += "</a>";
                    }
                    itemHtml += "</div>";
                    itemHtml += '<div class="paperList">';
                }
                itemHtml += '<a class="listItem listItem-border" is="emby-linkbutton" data-ripple="false" href="notificationsetting.html?type=' + notification.Type + '">';
                if (notification.Enabled) {
                    itemHtml += '<i class="listItemIcon md-icon">notifications_active</i>';
                } else {
                    itemHtml += '<i class="listItemIcon md-icon" style="background-color:#999;">notifications_off</i>';
                }
                itemHtml += '<div class="listItemBody">';
                itemHtml += '<div class="listItemBodyText">' + notification.Name + "</div>";
                itemHtml += "</div>";
                itemHtml += '<button type="button" is="paper-icon-button-light"><i class="md-icon">mode_edit</i></button>';
                itemHtml += "</a>";
                return itemHtml;
            }).join("");

            if (list.length) {
                html += "</div>";
                html += "</div>";
            }
            page.querySelector(".notificationList").innerHTML = html;
            loading.hide();
        })
    }

    return function(view, params) {
        view.addEventListener("viewshow", function() {
            reload(view);
        });
    }
});
