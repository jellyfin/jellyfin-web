define(['apphost', 'connectionManager', 'layoutManager', 'listViewStyle', 'emby-button'], function(appHost, connectionManager, layoutManager) {
    'use strict';

    return function(view, params) {
        view.querySelector('.btnLogout').addEventListener('click', function() {
            Dashboard.logout();
        });

        view.querySelector('.selectServer').addEventListener('click', function () {
            Dashboard.selectServer();
        });

        view.querySelector('.clientSettings').addEventListener('click', function () {
            window.NativeShell.openClientSettings();
        });

        view.addEventListener('viewshow', function() {
            // this page can also be used by admins to change user preferences from the user edit page
            var userId = params.userId || Dashboard.getCurrentUserId();
            var page = this;

            page.querySelector('.lnkMyProfile').setAttribute('href', 'myprofile.html?userId=' + userId);
            page.querySelector('.lnkDisplayPreferences').setAttribute('href', 'mypreferencesdisplay.html?userId=' + userId);
            page.querySelector('.lnkHomePreferences').setAttribute('href', 'mypreferenceshome.html?userId=' + userId);
            page.querySelector('.lnkPlaybackPreferences').setAttribute('href', 'mypreferencesplayback.html?userId=' + userId);
            page.querySelector('.lnkSubtitlePreferences').setAttribute('href', 'mypreferencessubtitles.html?userId=' + userId);

            if (window.NativeShell && window.NativeShell.AppHost.supports('clientsettings')) {
                page.querySelector('.clientSettings').classList.remove('hide');
            } else {
                page.querySelector('.clientSettings').classList.add('hide');
            }

            if (appHost.default.supports('multiserver')) {
                page.querySelector('.selectServer').classList.remove('hide');
            } else {
                page.querySelector('.selectServer').classList.add('hide');
            }

            // hide the actions if user preferences are being edited for a different user
            if (params.userId && params.userId !== Dashboard.getCurrentUserId) {
                page.querySelector('.userSection').classList.add('hide');
                page.querySelector('.adminSection').classList.add('hide');
            }

            ApiClient.getUser(userId).then(function(user) {
                page.querySelector('.headerUsername').innerHTML = user.Name;
                if (!user.Policy.IsAdministrator) {
                    page.querySelector('.adminSection').classList.add('hide');
                }
            });

            require(['autoFocuser'], function (autoFocuser) {
                autoFocuser.autoFocus(view);
            });
        });
    };
});
