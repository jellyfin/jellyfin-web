import appHost from 'apphost';
import layoutManager from 'layoutManager';
import 'listViewStyle';
import 'emby-button';

export default function (view, params) {
    view.querySelector('.btnLogout').addEventListener('click', function () {
        Dashboard.logout();
    });

    view.querySelector('.selectServer').addEventListener('click', function () {
        Dashboard.selectServer();
    });

    view.querySelector('.clientSettings').addEventListener('click', function () {
        window.NativeShell.openClientSettings();
    });

    view.addEventListener('viewshow', function () {
        // this page can also be used by admins to change user preferences from the user edit page
        const userId = params.userId || Dashboard.getCurrentUserId();
        const page = this;

        page.querySelector('.lnkMyProfile').setAttribute('href', 'myprofile.html?userId=' + userId);
        page.querySelector('.lnkDisplayPreferences').setAttribute('href', 'mypreferencesdisplay.html?userId=' + userId);
        page.querySelector('.lnkHomePreferences').setAttribute('href', 'mypreferenceshome.html?userId=' + userId);
        page.querySelector('.lnkPlaybackPreferences').setAttribute('href', 'mypreferencesplayback.html?userId=' + userId);
        page.querySelector('.lnkSubtitlePreferences').setAttribute('href', 'mypreferencessubtitles.html?userId=' + userId);
        page.querySelector('.lnkQuickConnectPreferences').setAttribute('href', 'mypreferencesquickconnect.html');

        if (window.NativeShell && window.NativeShell.AppHost.supports('clientsettings')) {
            page.querySelector('.clientSettings').classList.remove('hide');
        } else {
            page.querySelector('.clientSettings').classList.add('hide');
        }

        if (appHost.supports('multiserver')) {
            page.querySelector('.selectServer').classList.remove('hide');
        } else {
            page.querySelector('.selectServer').classList.add('hide');
        }

        ApiClient.getUser(userId).then(function (user) {
            page.querySelector('.headerUsername').innerHTML = user.Name;
            if (user.Policy.IsAdministrator && !layoutManager.tv) {
                page.querySelector('.adminSection').classList.remove('hide');
            }
        });

        // Hide the actions if user preferences are being edited for a different user
        if (params.userId && params.userId !== Dashboard.getCurrentUserId) {
            page.querySelector('.userSection').classList.add('hide');
            page.querySelector('.adminSection').classList.add('hide');
        }

        import('autoFocuser').then(({default: autoFocuser}) => {
            autoFocuser.autoFocus(view);
        });
    });
}
