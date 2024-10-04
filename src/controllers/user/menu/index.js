import { appHost } from '../../../components/apphost';
import '../../../components/listview/listview.scss';
import '../../../elements/emby-button/emby-button';
import layoutManager from '../../../components/layoutManager';
import Dashboard from '../../../utils/dashboard';

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

    view.querySelector('.exitApp').addEventListener('click', function () {
        appHost.exit();
    });

    view.addEventListener('viewshow', function () {
        // this page can also be used by admins to change user preferences from the user edit page
        const userId = params.userId || Dashboard.getCurrentUserId();
        const page = this;

        page.querySelector('.lnkUserProfile').setAttribute('href', '#/userprofile.html?userId=' + userId);
        page.querySelector('.lnkDisplayPreferences').setAttribute('href', '#/mypreferencesdisplay.html?userId=' + userId);
        page.querySelector('.lnkHomePreferences').setAttribute('href', '#/mypreferenceshome.html?userId=' + userId);
        page.querySelector('.lnkPlaybackPreferences').setAttribute('href', '#/mypreferencesplayback.html?userId=' + userId);
        page.querySelector('.lnkSubtitlePreferences').setAttribute('href', '#/mypreferencessubtitles.html?userId=' + userId);
        page.querySelector('.lnkQuickConnectPreferences').setAttribute('href', '#/quickconnect?userId=' + userId);
        page.querySelector('.lnkControlsPreferences').setAttribute('href', '#/mypreferencescontrols.html?userId=' + userId);

        const supportsClientSettings = appHost.supports('clientsettings');
        page.querySelector('.clientSettings').classList.toggle('hide', !supportsClientSettings);

        const supportsExitMenu = appHost.supports('exitmenu');
        page.querySelector('.exitApp').classList.toggle('hide', !supportsExitMenu);

        const supportsMultiServer = appHost.supports('multiserver');
        page.querySelector('.selectServer').classList.toggle('hide', !supportsMultiServer);

        page.querySelector('.lnkControlsPreferences').classList.toggle('hide', layoutManager.mobile);

        ApiClient.getQuickConnect('Enabled')
            .then(enabled => {
                if (enabled === true) {
                    page.querySelector('.lnkQuickConnectPreferences').classList.remove('hide');
                }
            })
            .catch(() => {
                console.debug('Failed to get QuickConnect status');
            });
        ApiClient.getUser(userId).then(function (user) {
            page.querySelector('.headerUsername').innerText = user.Name;
            if (user.Policy.IsAdministrator && !layoutManager.tv) {
                page.querySelector('.adminSection').classList.remove('hide');
            }
        });

        // Hide the actions if user preferences are being edited for a different user
        if (params.userId && params.userId !== Dashboard.getCurrentUserId) {
            page.querySelector('.userSection').classList.add('hide');
            page.querySelector('.adminSection').classList.add('hide');
            page.querySelector('.lnkControlsPreferences').classList.add('hide');
        }

        import('../../../components/autoFocuser').then(({ default: autoFocuser }) => {
            autoFocuser.autoFocus(view);
        });
    });
}
